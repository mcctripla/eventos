// Exportação completa do Painel Admin para .xlsx (somente leitura: não grava nada no banco).
// Recebe os dados que o AdminDashboard já tem em memória e devolve/baixa uma planilha com uma aba por área.
import * as xlsx from 'xlsx';

export interface AdminExportInput {
  events: any[];
  inventoryItems: any[];      // inventario + brindes + uniformes + estoque (cada item traz _collection)
  fornecedores: any[];
  participantes: any[];
  viagens: any[];
  baixasVendedores: any[];
  solicitacoes: any[];        // solicitacoes_brindes
  usersList?: any[];
}

export interface AdminExportOptions {
  includeUsers?: boolean;     // padrão: false (e-mails e papéis de acesso não entram na planilha)
  warnings?: string[];        // avisos exibidos na aba "Resumo" (ex.: coleções que falharam ao carregar)
}

const CELL_LIMIT = 32000;     // limite do Excel é 32.767 caracteres por célula

// ─── Utilitários ────────────────────────────────────────────────────────────

/** Aceita número ou texto ("R$ 1.250,00", "1.250,50", "1250.5"). Devolve null se não der para ler com segurança. */
export function parseMoney(v: any): number | null {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const txt = String(v).replace(/R\$/gi, '');
  if (/[a-z]/i.test(txt)) return null; // USD, K, "mil"...: não adivinhar
  let s = txt.replace(/[^\d,.\-]/g, '');
  if (!s || s === '-' || s === '.' || s === ',') return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');           // formato brasileiro
  } else {
    const dots = (s.match(/\./g) || []).length;
    // "1.250" (ponto + exatamente 3 dígitos) é lido como milhar; "12.5" como decimal
    if (dots > 1 || /^-?\d{1,3}\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return isFinite(n) ? n : null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDay = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const fmtDayTime = (d: Date) => `${fmtDay(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Datas vindas do Firestore, do Excel (número serial) ou texto. Devolve '' se vazio. */
export function fmtDate(d: any, withTime = false): string {
  if (d === null || d === undefined || d === '') return '';
  if (d instanceof Date) return isNaN(d.getTime()) ? '' : (withTime ? fmtDayTime(d) : fmtDay(d));
  if (typeof d === 'object' && typeof d.toDate === 'function') return fmtDate(d.toDate(), withTime);
  if (typeof d === 'object' && typeof d.seconds === 'number') return fmtDate(new Date(d.seconds * 1000), withTime);
  if (typeof d === 'number') {
    // serial do Excel; UTC evita sair 1 dia antes no fuso do Brasil
    return new Date((d - 25569) * 86400 * 1000).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; }
    if (/^\d{4}-\d{2}-\d{2}T/.test(d)) { const dt = new Date(d); return isNaN(dt.getTime()) ? d : (withTime ? fmtDayTime(dt) : fmtDay(dt)); }
  }
  return String(d);
}

/** Valor "solto" para uma célula: datas formatadas, listas/objetos como JSON, booleanos como Sim/Não. */
function plain(v: any): string | number {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (v instanceof Date || (typeof v === 'object' && (typeof v.toDate === 'function' || typeof v.seconds === 'number'))) {
    return fmtDate(v, true);
  }
  if (typeof v === 'object') {
    const t = JSON.stringify(v);
    return t.length > CELL_LIMIT ? t.slice(0, CELL_LIMIT) + ' …[cortado]' : t;
  }
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return fmtDate(s, true);
  return s.length > CELL_LIMIT ? s.slice(0, CELL_LIMIT) + ' …[cortado]' : s;
}

type Col = { key: string; label: string; money?: boolean; date?: boolean };

/**
 * Monta as linhas de uma aba. As colunas de `cols` vêm primeiro e na ordem dada; qualquer outro campo
 * que exista nos registros vai para o final (assim nada é perdido se o app ganhar campos novos).
 * Colunas monetárias: número quando dá para ler; se não der, o texto original é mantido.
 */
function table(records: any[], cols: Col[], skipKeys: string[] = []): any[] {
  const known = new Set(cols.map((c) => c.key));
  const extra: string[] = [];
  records.forEach((r) => Object.keys(r || {}).forEach((k) => {
    if (!known.has(k) && !skipKeys.includes(k) && !extra.includes(k)) extra.push(k);
  }));
  extra.sort();
  return records.map((r) => {
    const row: any = {};
    cols.forEach((c) => {
      const v = r?.[c.key];
      if (c.money) { const n = parseMoney(v); row[c.label] = n !== null ? n : plain(v); }
      else if (c.date) row[c.label] = fmtDate(v, true);
      else row[c.label] = plain(v);
    });
    extra.forEach((k) => { row[k] = plain(r?.[k]); });
    return row;
  });
}

const sum = (arr: any[]) => arr.reduce((acc: number, v: any) => acc + (typeof v === 'number' ? v : 0), 0);
const money = (v: any) => { const n = parseMoney(v); return n === null ? '' : n; };

// ─── Exportação principal ───────────────────────────────────────────────────

export function exportAdminWorkbook(input: AdminExportInput, opts: AdminExportOptions = {}) {
  const { events, inventoryItems, fornecedores, participantes, viagens, baixasVendedores, solicitacoes } = input;
  const realEvents = (events || [])
    .filter((e: any) => !e.isHoliday)
    .slice()
    .sort((a: any, b: any) => (a.date?.getTime?.() ?? 0) - (b.date?.getTime?.() ?? 0));

  // ── Projetos/Eventos + Financeiro ──
  const eventRows: any[] = [];
  const lancRows: any[] = [];
  const outrosRows: any[] = [];
  const brindeRows: any[] = [];
  let totOrcamento = 0, totCustoReal = 0, totLanc = 0;
  let naoLidos = 0; // valores gravados em texto que não puderam virar número (ficam fora dos totais)
  const contaNaoLido = (v: any) => { if (v !== undefined && v !== null && String(v).trim() !== '' && parseMoney(v) === null) naoLidos++; };

  realEvents.forEach((ev: any) => {
    const lancs: any[] = Array.isArray(ev.lancamentos_financeiros) ? ev.lancamentos_financeiros : [];
    const outros: any[] = Array.isArray(ev.outros_custos_lista) ? ev.outros_custos_lista : [];
    const brindes: any[] = Array.isArray(ev.brindes_alocados) ? ev.brindes_alocados : [];
    const somaLanc = sum(lancs.map((l: any) => money(l?.valor)));
    const somaOutros = sum(outros.map((o: any) => money(o?.valor)));
    const orcamento = money(ev.orcamento_total);
    const custoReal = money(ev.custo_real);
    const receita = money(ev.receita_estimada);
    const pipe = money(ev.previsao_pipe);
    const fechamento = money(ev.previsao_fechamento);
    const legado = [ev.custo_brindes, ev.custo_uniformes, ev.custo_ingressos, ev.custo_passagens, ev.custo_hospedagem, ev.custo_outros].map(money);
    const temFinanceiro = lancs.length > 0 || outros.length > 0 ||
      [orcamento, custoReal, receita, pipe, fechamento, ...legado].some((v) => typeof v === 'number' && v !== 0);

    if (typeof orcamento === 'number') totOrcamento += orcamento;
    if (typeof custoReal === 'number') totCustoReal += custoReal;
    totLanc += somaLanc;
    lancs.forEach((l: any) => contaNaoLido(l?.valor));
    outros.forEach((o: any) => contaNaoLido(o?.valor));

    eventRows.push({
      'ID': ev.id,
      'Evento': ev.title || '',
      'Categoria': ev.category || '',
      'Status': ev.status || '',
      'Responsável': ev.host || '',
      'Formato': ev.format || '',
      'Início': fmtDate(ev.date),
      'Fim': fmtDate(ev.endDate),
      'Local': ev.location || '',
      'UF': ev.uf || '',
      'Tipo financeiro': ev.tipo_financeiro || '',
      'Cota comercial': ev.commercialQuota || ev.cota || '',
      'Orçamento total (R$)': orcamento,
      'Custo real (R$)': custoReal,
      'Soma dos lançamentos (R$)': lancs.length ? somaLanc : '',
      'Receita estimada (R$)': receita,
      'Previsão de pipe (R$)': pipe,
      'Previsão de fechamento (R$)': fechamento,
      'Custo brindes (R$)': legado[0],
      'Custo uniformes (R$)': legado[1],
      'Custo ingressos (R$)': legado[2],
      'Custo passagens (R$)': legado[3],
      'Custo hospedagem (R$)': legado[4],
      'Custo outros (R$)': legado[5],
      'Soma de outros custos listados (R$)': outros.length ? somaOutros : '',
      'Nº de lançamentos': lancs.length,
      'Vagas staff': ev.vagas_staff ?? ev.staffCount ?? '',
      'Vagas clientes': ev.vagas_cliente ?? ev.clientCount ?? '',
      'Vagas VIP': ev.vagas_vip ?? ev.vipCount ?? '',
      'Brindes alocados (qtd)': sum(brindes.map((b: any) => Number(b?.qtd) || 0)),
      'Apuração finalizada': ev.apuracao_finalizada === true ? 'Sim' : (ev.apuracao_finalizada === false ? 'Não' : ''),
      'Tem dados financeiros': temFinanceiro ? 'Sim' : 'Não',
    });

    lancs.forEach((l: any, i: number) => lancRows.push({
      'ID do evento': ev.id, 'Evento': ev.title || '', 'Item': i + 1,
      'Conta': l?.descConta ?? '', 'Lançamento': fmtDate(l?.dataLancamento), 'Vencimento': fmtDate(l?.dataVencimento),
      'Fornecedor': l?.fornecedor ?? '', 'Observações': l?.observacoes ?? '',
      'Valor (R$)': money(l?.valor),
      'Valor original (como gravado)': l?.valor === undefined || l?.valor === null ? '' : String(l.valor),
    }));

    outros.forEach((o: any, i: number) => outrosRows.push({
      'ID do evento': ev.id, 'Evento': ev.title || '', 'Item': i + 1,
      'Nome': o?.nome ?? '', 'Descrição': o?.descricao ?? '',
      'Valor (R$)': money(o?.valor),
      'Valor original (como gravado)': o?.valor === undefined || o?.valor === null ? '' : String(o.valor),
    }));

    brindes.forEach((b: any, i: number) => brindeRows.push({
      'ID do evento': ev.id, 'Evento': ev.title || '', 'Item': i + 1,
      'Brinde/Item': b?.nome ?? b?.item ?? '', 'Tipo': b?.tipo ?? '',
      'Qtd alocada': Number(b?.qtd) || 0,
      'Qtd consumida': b?.qtd_consumida ?? '', 'Qtd retornada': b?.qtd_retornada ?? '',
      'Baixa confirmada': b?.baixa_confirmada === true ? 'Sim' : (b?.baixa_confirmada === false ? 'Não' : ''),
    }));
  });

  // ── Estoque (inventario + brindes + uniformes + estoque) ──
  const estoqueSorted = (inventoryItems || []).slice().sort((a: any, b: any) =>
    String(a._collection || '').localeCompare(String(b._collection || '')) || String(a.nome || '').localeCompare(String(b.nome || '')));
  const estoqueRows = table(estoqueSorted, [
    { key: 'id', label: 'ID' },
    { key: '_collection', label: 'Origem' },
    { key: 'nome', label: 'Nome' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'quantidade', label: 'Quantidade' },
    { key: 'custo_unitario', label: 'Custo unitário (R$)', money: true },
    { key: 'preco', label: 'Preço (R$)', money: true },
    { key: 'status', label: 'Status' },
    { key: 'nivel', label: 'Nível' },
    { key: 'vip', label: 'VIP' },
    { key: 'fornecedor', label: 'Fornecedor' },
    { key: 'evento_id', label: 'ID do evento' },
    { key: 'descricao', label: 'Descrição' },
    { key: 'tamanhos', label: 'Tamanhos (JSON)' },
    { key: 'createdAt', label: 'Criado em', date: true },
    { key: 'updatedAt', label: 'Atualizado em', date: true },
  ]);
  // Valor estimado = quantidade × custo unitário (ou preço, se não houver custo). Só quando ambos são números.
  let totEstoque = 0;
  estoqueRows.forEach((row, i) => {
    const it: any = estoqueSorted[i];
    const unit = money(it.custo_unitario) !== '' ? money(it.custo_unitario) : money(it.preco);
    const qtd = Number(it.quantidade);
    if (typeof unit === 'number' && isFinite(qtd)) { row['Valor estimado em estoque (R$)'] = unit * qtd; totEstoque += unit * qtd; }
    else row['Valor estimado em estoque (R$)'] = '';
  });

  // ── Demais abas ──
  const fornecedorRows = table(fornecedores || [], [
    { key: 'id', label: 'ID' }, { key: 'nome', label: 'Nome' }, { key: 'contato_responsavel', label: 'Contato responsável' },
    { key: 'email', label: 'E-mail' }, { key: 'telefone', label: 'Telefone' },
    { key: 'createdAt', label: 'Criado em', date: true }, { key: 'updatedAt', label: 'Atualizado em', date: true },
  ]);
  const participanteRows = table(participantes || [], [
    { key: 'id', label: 'ID' }, { key: 'nome', label: 'Nome' }, { key: 'funcao', label: 'Função' },
    { key: 'email', label: 'E-mail' }, { key: 'telefone', label: 'Telefone' }, { key: 'tamanho', label: 'Tamanho' },
    { key: 'createdAt', label: 'Criado em', date: true }, { key: 'updatedAt', label: 'Atualizado em', date: true },
  ]);
  const viagemRows = table(viagens || [], [
    { key: 'id', label: 'ID' }, { key: 'trecho', label: 'Trecho' }, { key: 'passageiro', label: 'Passageiro' },
    { key: 'status', label: 'Status' }, { key: 'localizador', label: 'Localizador' },
    { key: 'valor', label: 'Valor (R$)', money: true },
    { key: 'createdAt', label: 'Criado em', date: true }, { key: 'updatedAt', label: 'Atualizado em', date: true },
  ]);
  const baixaSorted = (baixasVendedores || []).slice().sort((a: any, b: any) =>
    (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0));
  const baixaRows = table(baixaSorted, [
    { key: 'id', label: 'ID' }, { key: 'data', label: 'Data', date: true }, { key: 'itemName', label: 'Item' },
    { key: 'itemCollection', label: 'Origem do item' }, { key: 'quantidade', label: 'Quantidade' },
    { key: 'vendedor', label: 'Vendedor' }, { key: 'cliente', label: 'Cliente' }, { key: 'motivo', label: 'Motivo' },
    { key: 'custo_unitario', label: 'Custo unitário (R$)', money: true }, { key: 'custo_total', label: 'Custo total (R$)', money: true },
    { key: 'timestamp', label: 'Registrado em', date: true },
  ], ['itemId']);
  const totBaixas = sum(baixaSorted.map((b: any) => money(b.custo_total)));

  const solicSorted = (solicitacoes || []).slice().sort((a: any, b: any) =>
    (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0));
  const solicRows = table(solicSorted, [
    { key: 'id', label: 'ID' }, { key: 'data_entrega', label: 'Data de entrega', date: true }, { key: 'status', label: 'Status' },
    { key: 'vendedor', label: 'Vendedor' }, { key: 'cliente', label: 'Cliente' }, { key: 'motivo', label: 'Motivo' },
    { key: 'timestamp', label: 'Solicitado em', date: true },
  ], ['itens']);
  const solicItemRows: any[] = [];
  solicSorted.forEach((s: any) => {
    (Array.isArray(s.itens) ? s.itens : []).forEach((it: any, i: number) => {
      const unit = money(it?.custo_unitario);
      const q = Number(it?.quantidade);
      solicItemRows.push({
        'ID da solicitação': s.id, 'Status': s.status ?? '', 'Vendedor': s.vendedor ?? '', 'Cliente': s.cliente ?? '',
        'Item': it?.itemName ?? '', 'Quantidade': isFinite(q) ? q : '',
        'Custo unitário (R$)': unit,
        'Custo total (R$)': typeof unit === 'number' && isFinite(q) ? unit * q : '',
      });
    });
  });

  const includeUsers = !!opts.includeUsers;
  const userRows = includeUsers ? table(input.usersList || [], [
    { key: 'id', label: 'ID' }, { key: 'nome', label: 'Nome' }, { key: 'email', label: 'E-mail' },
    { key: 'role', label: 'Papel' }, { key: 'createdAt', label: 'Criado em', date: true },
  ]) : [];

  // ── Montagem do arquivo ──
  const wb = xlsx.utils.book_new();
  const counts: Record<string, number> = {};
  const add = (name: string, rows: any[], widths?: number[]) => {
    const ws = xlsx.utils.json_to_sheet(rows.length ? rows : [{ Aviso: 'Sem registros' }]);
    if (widths) ws['!cols'] = widths.map((wch) => ({ wch }));
    xlsx.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    counts[name] = rows.length;
  };

  // "Resumo" entra primeiro na ordem das abas; o conteúdo é preenchido no fim, quando os contadores existem
  add('Resumo', [{ Item: '…', Valor: '' }]);

  add('Projetos-Eventos', eventRows, [24, 38, 22, 14, 22, 12, 11, 11, 28, 6, 16, 28, 16, 14, 18, 16, 16, 18, 14, 14, 14, 14, 16, 12, 20, 12, 12, 12, 12, 12, 12, 12]);
  add('Lançamentos', lancRows, [24, 38, 6, 28, 12, 12, 26, 40, 14, 22]);
  add('Outros custos', outrosRows, [24, 38, 6, 24, 36, 14, 22]);
  add('Brindes por evento', brindeRows, [24, 38, 6, 30, 14, 12, 12, 12, 14]);
  add('Estoque', estoqueRows, [24, 14, 34, 12, 11, 16, 14, 14, 12, 6, 24, 24, 36, 24, 18, 18, 20]);
  add('Fornecedores', fornecedorRows, [24, 30, 24, 30, 16, 18, 18]);
  add('Participantes', participanteRows, [24, 30, 20, 30, 16, 12, 18, 18]);
  add('Viagens', viagemRows, [24, 30, 26, 12, 14, 14, 18, 18]);
  add('Baixas vendedores', baixaRows, [24, 12, 30, 14, 11, 20, 24, 30, 16, 16, 18]);
  add('Solicitações brindes', solicRows, [24, 14, 12, 20, 24, 30, 18]);
  add('Itens das solicitações', solicItemRows, [24, 12, 20, 24, 30, 11, 16, 16]);
  if (includeUsers) add('Usuários', userRows, [24, 26, 32, 12, 18]);

  const stamp = new Date();
  const resumo: any[] = [
    { Item: 'Exportado em', Valor: fmtDayTime(stamp) },
    { Item: 'Origem', Valor: 'Painel Admin (dados carregados na tela no momento da exportação)' },
    { Item: '', Valor: '' },
    { Item: 'TOTAIS (calculados na exportação)', Valor: '' },
    { Item: 'Orçamento total dos eventos (R$)', Valor: totOrcamento },
    { Item: 'Custo real dos eventos (R$)', Valor: totCustoReal },
    { Item: 'Soma dos lançamentos financeiros (R$)', Valor: totLanc },
    { Item: 'Custo das baixas de vendedores (R$)', Valor: totBaixas },
    { Item: 'Valor estimado em estoque (R$)', Valor: totEstoque },
    { Item: 'Valores de lançamentos/custos não lidos como número', Valor: naoLidos },
    { Item: '', Valor: '' },
    { Item: 'REGISTROS POR ABA', Valor: '' },
    ...Object.entries(counts).filter(([k]) => k !== 'Resumo').map(([k, v]) => ({ Item: k, Valor: v })),
    { Item: '', Valor: '' },
    { Item: 'OBSERVAÇÕES', Valor: '' },
    { Item: 'Custo real x soma dos lançamentos', Valor: 'O app calcula o custo real ao salvar o evento; os dois podem divergir. Ambos estão na aba Projetos-Eventos.' },
    { Item: 'Valores em texto', Valor: 'Valores como "R$ 1.250,00" foram convertidos em número. O que não pôde ser lido com segurança (ex.: "USD 1,5K") foi mantido como texto e fica FORA dos totais; veja a coluna "Valor original" nas abas Lançamentos e Outros custos. "1.250" é lido como 1250 (milhar) e "12.5" como 12,5.' },
    { Item: 'Valor estimado em estoque', Valor: 'Quantidade × custo unitário (ou preço, se não houver custo). Vazio quando faltar um dos dois.' },
    { Item: 'Usuários', Valor: includeUsers ? 'Incluídos.' : 'Não incluídos (e-mails e papéis de acesso).' },
    ...((opts.warnings || []).map((w) => ({ Item: 'AVISO', Valor: w }))),
  ];
  const wsResumo = xlsx.utils.json_to_sheet(resumo);
  wsResumo['!cols'] = [{ wch: 42 }, { wch: 110 }];
  wb.Sheets['Resumo'] = wsResumo;

  const fileName = `painel_admin_${stamp.getFullYear()}-${pad(stamp.getMonth() + 1)}-${pad(stamp.getDate())}.xlsx`;
  return { wb, fileName, counts };
}

/** Gera e baixa o arquivo no navegador. */
export function downloadAdminWorkbook(input: AdminExportInput, opts: AdminExportOptions = {}) {
  const { wb, fileName, counts } = exportAdminWorkbook(input, opts);
  xlsx.writeFile(wb, fileName);
  return { fileName, counts };
}

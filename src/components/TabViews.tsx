import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import {
  Package, Truck, UserCheck, Plane, Plus, X, Trash2, Edit3,
  Search, DollarSign, Tag, Phone, Mail, ExternalLink, TrendingUp,
  Hotel, Navigation, MapPin, Calendar, Clock, CheckCircle2, AlertCircle,
  Users, Building, Globe, Eye, BarChart3, ArrowRightLeft,
  BookOpen, HelpCircle, Info, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   SHARED UTILS
───────────────────────────────────────────────────────────────── */
const inputCls = (dark: boolean) =>
  `w-full p-3 rounded-xl border text-xs font-medium outline-none transition-all ${
    dark
      ? 'bg-zinc-950 border-white/8 text-white focus:border-indigo-500 placeholder-zinc-600'
      : 'bg-slate-50 border-slate-200 text-zinc-900 focus:border-indigo-500 placeholder-slate-400'
  }`;

const labelCls = 'block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5';

const cardCls = (dark: boolean) =>
  `rounded-2xl border p-5 transition-all hover:scale-[1.005] ${
    dark
      ? 'bg-zinc-900/50 border-white/5 hover:border-white/10'
      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
  }`;

const btnPrimary = 'flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md';
const btnSecondary = (dark: boolean) =>
  `flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
    dark ? 'border-white/10 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-zinc-700'
  }`;
const btnDanger = 'flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-all';
/* ─────────────────────────────────────────────────────────────────
   EMPTY STATE COMPONENT
───────────────────────────────────────────────────────────────── */
interface EmptyStateProps {
  darkMode: boolean;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  isFilterActive?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({
  darkMode,
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  isFilterActive,
  onClearFilters
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center rounded-3xl border border-dashed transition-all duration-300 ${
      darkMode 
        ? 'bg-zinc-900/20 border-white/10 hover:border-white/20' 
        : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
    }`}>
      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${
        darkMode 
          ? 'bg-zinc-900/80 border border-white/5 text-indigo-400 shadow-[0_0_30px_-5px_rgba(99,102,241,0.2)]' 
          : 'bg-white border border-slate-100 text-indigo-600 shadow-[0_10px_25px_-5px_rgba(99,102,241,0.1)]'
      }`}>
        <Icon className="h-7 w-7 animate-pulse" />
      </div>
      <h3 className={`text-base font-bold font-display tracking-tight mb-2 ${
        darkMode ? 'text-white' : 'text-zinc-900'
      }`}>
        {title}
      </h3>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {isFilterActive && onClearFilters ? (
        <button
          onClick={onClearFilters}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 active:scale-95 cursor-pointer"
        >
          Limpar Filtros
        </button>
      ) : (
        onAction && actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{actionLabel}</span>
          </button>
        )
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   INVENTÁRIO TAB
───────────────────────────────────────────────────────────────── */
interface InventarioTabProps { 
  darkMode: boolean; 
  inventoryItems: any[]; 
  events?: any[];
  baixasVendedores?: any[];
  showToast: (m: string) => void; 
}

export function InventarioTab({ darkMode, inventoryItems, events = [], baixasVendedores = [], showToast }: InventarioTabProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<'estoque' | 'vendedores' | 'eventos'>('estoque');
  const [search, setSearch] = React.useState('');
  const [filterCol, setFilterCol] = React.useState('todos');
  const [isOpen, setIsOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any>(null);

  // States for Vendedor Withdrawal Form
  const [selectedItemId, setSelectedItemId] = React.useState('');
  const [vendedorName, setVendedorName] = React.useState('');
  const [clienteName, setClienteName] = React.useState('');
  const [baixaQty, setBaixaQty] = React.useState<number | ''>('');
  const [baixaDate, setBaixaDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [baixaReason, setBaixaReason] = React.useState('');
  const [isSubmittingBaixa, setIsSubmittingBaixa] = React.useState(false);

  // States for search and filter in other tabs
  const [vendedorSearch, setVendedorSearch] = React.useState('');
  const [eventSearch, setEventSearch] = React.useState('');

  const [errors, setErrors] = React.useState<Record<string, boolean>>({});
  const [shake, setShake] = React.useState(false);

  const [form, setForm] = React.useState({ nome: '', descricao: '', quantidade: '', unidade: '', categoria: '', fornecedor: '', custo_unitario: '', _collection: 'inventario' });

  const collectionColors: Record<string, string> = {
    inventario: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    brindes: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    uniformes: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    estoque: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  const collectionLabels: Record<string, string> = {
    inventario: 'Inventário', brindes: 'Brindes', uniformes: 'Uniformes', estoque: 'Estoque'
  };

  const filteredItems = inventoryItems.filter(i => {
    const matchSearch = (i.nome || '').toLowerCase().includes(search.toLowerCase());
    const matchCol = filterCol === 'todos' || i._collection === filterCol;
    return matchSearch && matchCol;
  });

  const sortedItemsForSelect = [...inventoryItems]
    .filter(i => (i.quantidade || 0) > 0)
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  // withdrawals (baixas) filtered and sorted
  const filteredBaixas = baixasVendedores
    .filter(b => {
      const term = vendedorSearch.toLowerCase();
      return (b.vendedor || '').toLowerCase().includes(term) ||
             (b.cliente || '').toLowerCase().includes(term) ||
             (b.itemName || '').toLowerCase().includes(term);
    })
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  // map all allocated gifts in events
  const eventGifts = events
    .flatMap(ev => {
      const allocated = ev.brindes_alocados || [];
      return allocated.map((g: any) => ({
        id: g.id || `${ev.id}-${g.docId || g.item}`,
        itemId: g.docId,
        itemName: g.item,
        quantidade: g.qtd || 0,
        eventId: ev.id,
        eventName: ev.evento,
        eventDate: ev.data_ini,
        eventStatus: ev.status || 'Planejado',
        category: g._collection || 'inventario'
      }));
    })
    .filter(g => {
      const term = eventSearch.toLowerCase();
      return (g.itemName || '').toLowerCase().includes(term) ||
             (g.eventName || '').toLowerCase().includes(term);
    })
    .sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || ''));

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setErrors({});
    setShake(false);
    setForm({ nome: '', descricao: '', quantidade: '', unidade: '', categoria: '', fornecedor: '', custo_unitario: '', _collection: 'inventario' });
  };

  const handleSave = async () => {
    if (!form.nome) {
      setErrors({ nome: true });
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return showToast('Nome é obrigatório.');
    }
    const payload = { ...form, quantidade: parseInt(form.quantidade) || 0, custo_unitario: parseFloat(form.custo_unitario) || 0 };
    if (editing) {
      await updateDoc(doc(db, editing._collection, editing.id), payload);
      showToast('Item atualizado com sucesso!');
    } else {
      await addDoc(collection(db, form._collection), payload);
      showToast('Item adicionado ao inventário!');
    }
    closeModal();
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setErrors({});
    setShake(false);
    setForm({ nome: item.nome || '', descricao: item.descricao || '', quantidade: item.quantidade?.toString() || '', unidade: item.unidade || '', categoria: item.categoria || '', fornecedor: item.fornecedor || '', custo_unitario: item.custo_unitario?.toString() || '', _collection: item._collection });
    setIsOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Excluir "${item.nome}"?`)) return;
    await deleteDoc(doc(db, item._collection, item.id));
    showToast('Item removido do inventário.');
  };

  const handleCreateBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      return showToast('Selecione um item do estoque.');
    }
    if (!vendedorName.trim()) {
      return showToast('Digite o nome do vendedor.');
    }
    if (!clienteName.trim()) {
      return showToast('Digite o nome do cliente/empresa.');
    }
    const qty = Number(baixaQty);
    if (!qty || qty <= 0) {
      return showToast('Digite uma quantidade válida maior que zero.');
    }

    const item = inventoryItems.find(i => i.id === selectedItemId);
    if (!item) {
      return showToast('Item não encontrado.');
    }

    const currentQty = Number(item.quantidade) || 0;
    if (currentQty < qty) {
      return showToast(`Saldo insuficiente! Apenas ${currentQty} unidades disponíveis.`);
    }

    setIsSubmittingBaixa(true);
    try {
      // 1. Criar registro na coleção 'baixas_vendedores'
      const payload = {
        itemId: item.id,
        itemName: item.nome,
        itemCollection: item._collection || 'inventario',
        vendedor: vendedorName,
        cliente: clienteName,
        quantidade: qty,
        data: baixaDate,
        motivo: baixaReason,
        custo_unitario: Number(item.custo_unitario) || 0,
        custo_total: (Number(item.custo_unitario) || 0) * qty,
        timestamp: Timestamp.now()
      };

      await addDoc(collection(db, 'baixas_vendedores'), payload);

      // 2. Dar baixa no estoque
      const col = item._collection || 'inventario';
      const docRef = doc(db, col, item.id);
      await updateDoc(docRef, { quantidade: Math.max(0, currentQty - qty) });

      // 3. Resetar form
      setSelectedItemId('');
      setVendedorName('');
      setClienteName('');
      setBaixaQty('');
      setBaixaReason('');
      showToast('Baixa de estoque registrada com sucesso!');
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao registrar baixa no estoque.');
    } finally {
      setIsSubmittingBaixa(false);
    }
  };

  const handleDeleteBaixa = async (baixa: any) => {
    if (!confirm(`Deseja realmente estornar a retirada de ${baixa.quantidade}x "${baixa.itemName}" pelo vendedor ${baixa.vendedor}? O saldo será devolvido ao estoque.`)) {
      return;
    }

    try {
      // 1. Achar o item de estoque correspondente
      const item = inventoryItems.find(i => i.id === baixa.itemId);
      if (item) {
        const col = item._collection || baixa.itemCollection || 'inventario';
        const docRef = doc(db, col, item.id);
        const currentQty = Number(item.quantidade) || 0;
        await updateDoc(docRef, { quantidade: currentQty + baixa.quantidade });
      } else {
        showToast('Aviso: O item original do estoque não existe mais, mas o registro de baixa foi removido.');
      }

      // 2. Deletar registro de baixa
      await deleteDoc(doc(db, 'baixas_vendedores', baixa.id));
      showToast('Baixa estornada com sucesso!');
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao estornar a baixa de estoque.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    if (dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  };

  // totals for display
  const totalVolumeEstoque = inventoryItems.reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0);
  const valorTotalEstoque = inventoryItems.reduce((acc, i) => acc + ((Number(i.quantidade) || 0) * (Number(i.custo_unitario) || 0)), 0);

  return (
    <div className="w-full px-6 lg:px-12 xl:px-16 py-8 relative z-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
            <Package className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Gestão de Estoque</h2>
            <p className={`text-xs font-medium mt-0.5 ${darkMode ? 'text-zinc-500' : 'text-zinc-550'}`}>
              Volume total: <span className="font-extrabold">${totalVolumeEstoque} unidades</span> | Valor estimado: <span className="font-extrabold text-emerald-500">R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>
        
        {activeSubTab === 'estoque' && (
          <button onClick={() => setIsOpen(true)} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            <span>Novo Item</span>
          </button>
        )}
      </div>

      {/* Internal Subtabs Navigation */}
      <div className="flex border-b border-slate-200/40 dark:border-white/5 mb-8">
        <button
          onClick={() => setActiveSubTab('estoque')}
          className={`pb-4 px-6 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'estoque'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-300'
          }`}
        >
          Estoque Atual
        </button>
        <button
          onClick={() => setActiveSubTab('vendedores')}
          className={`pb-4 px-6 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'vendedores'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-300'
          }`}
        >
          Saídas para Vendedores
        </button>
        <button
          onClick={() => setActiveSubTab('eventos')}
          className={`pb-4 px-6 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'eventos'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-300'
          }`}
        >
          Itens em Eventos
        </button>
      </div>

      {/* SUBTAB CONTENT 1: ESTOQUE ATUAL */}
      {activeSubTab === 'estoque' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar item no estoque..." className={`${inputCls(darkMode)} pl-9`} />
            </div>
            <select value={filterCol} onChange={e => setFilterCol(e.target.value)} className={`${inputCls(darkMode)} w-full sm:w-48`}>
              <option value="todos">Todos os tipos</option>
              <option value="inventario">Inventário</option>
              <option value="brindes">Brindes</option>
              <option value="uniformes">Uniformes</option>
              <option value="estoque">Estoque</option>
            </select>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
            {Object.entries(collectionLabels).map(([key, label]) => {
              const itemsOfCol = inventoryItems.filter(i => i._collection === key);
              const count = itemsOfCol.length;
              const totalColQty = itemsOfCol.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);
              return (
                <div key={key} className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <p className={`text-xl font-black font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{count}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">{label}</p>
                  <p className="text-[9px] font-semibold text-zinc-500 mt-0.5">{totalColQty} unidades</p>
                </div>
              );
            })}
          </div>

          {/* Items Grid */}
          {filteredItems.length === 0 ? (
            <EmptyState
              darkMode={darkMode}
              icon={Package}
              title={search !== '' || filterCol !== 'todos' ? 'Nenhum resultado encontrado' : 'Inventário vazio'}
              description={search !== '' || filterCol !== 'todos' ? `Não encontramos itens correspondentes a sua busca.` : 'Adicione itens como brindes, uniformes e materiais para começar.'}
              actionLabel="Novo Item"
              onAction={() => setIsOpen(true)}
              isFilterActive={search !== '' || filterCol !== 'todos'}
              onClearFilters={() => { setSearch(''); setFilterCol('todos'); }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const totalItemVal = (Number(item.quantidade) || 0) * (Number(item.custo_unitario) || 0);
                return (
                  <div key={item.id} className={cardCls(darkMode)}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${collectionColors[item._collection] || 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                        {collectionLabels[item._collection] || item._collection}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => handleEdit(item)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-slate-100'} transition-colors`}>
                          <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
                        </button>
                        <button onClick={() => handleDelete(item)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'} transition-colors`}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                        </button>
                      </div>
                    </div>
                    <h3 className={`font-bold text-sm font-display mb-1 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{item.nome}</h3>
                    {item.descricao && <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed line-clamp-2">{item.descricao}</p>}
                    
                    <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-200/40 dark:border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-medium flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Saldo:</span>
                        <span className={`font-bold ${item.quantidade <= 5 ? 'text-amber-500' : darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
                          {item.quantidade ?? '-'} {item.unidade || 'un'}
                          {item.quantidade <= 5 && <span className="text-[8px] font-black tracking-wider uppercase ml-1.5 p-0.5 rounded bg-amber-500/10 border border-amber-500/10">Baixo</span>}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-medium">Custo Unitário:</span>
                        <span className="font-bold text-zinc-500 dark:text-zinc-300">R$ {Number(item.custo_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>

                      {totalItemVal > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-dashed border-slate-200/40 dark:border-white/5">
                          <span className="text-zinc-400 font-medium">Valor Total:</span>
                          <span className="font-extrabold text-emerald-500">R$ {totalItemVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB CONTENT 2: SAÍDAS PARA VENDEDORES */}
      {activeSubTab === 'vendedores' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
          {/* Form Column */}
          <div className="lg:col-span-1">
            <div className={cardCls(darkMode)}>
              <div className="flex items-center space-x-2.5 mb-5 border-b border-slate-200/40 dark:border-white/5 pb-4">
                <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
                <h3 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Nova Baixa (Reunião/Brinde)</h3>
              </div>

              <form onSubmit={handleCreateBaixa} className="space-y-4">
                <div>
                  <label className={labelCls}>Selecionar Item do Estoque *</label>
                  <select
                    value={selectedItemId}
                    onChange={e => setSelectedItemId(e.target.value)}
                    className={inputCls(darkMode)}
                    required
                  >
                    <option value="">Selecione um item com saldo...</option>
                    {sortedItemsForSelect.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nome} (Saldo: {item.quantidade} {item.unidade || 'un'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Nome do Vendedor *</label>
                  <input
                    type="text"
                    value={vendedorName}
                    onChange={e => setVendedorName(e.target.value)}
                    placeholder="Ex: Carlos Albuquerque"
                    className={inputCls(darkMode)}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Cliente / Empresa Destino *</label>
                  <input
                    type="text"
                    value={clienteName}
                    onChange={e => setClienteName(e.target.value)}
                    placeholder="Ex: Empresa Parceira Ltda"
                    className={inputCls(darkMode)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Quantidade *</label>
                    <input
                      type="number"
                      min="1"
                      value={baixaQty}
                      onChange={e => setBaixaQty(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                      placeholder="0"
                      className={inputCls(darkMode)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Data da Saída *</label>
                    <input
                      type="date"
                      value={baixaDate}
                      onChange={e => setBaixaDate(e.target.value)}
                      className={inputCls(darkMode)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Observações / Motivo (Opcional)</label>
                  <textarea
                    rows={3}
                    value={baixaReason}
                    onChange={e => setBaixaReason(e.target.value)}
                    placeholder="Ex: Reunião comercial estratégica de kick-off..."
                    className={`${inputCls(darkMode)} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingBaixa}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  {isSubmittingBaixa ? <span>Registrando...</span> : <span>Confirmar e dar Baixa</span>}
                </button>
              </form>
            </div>
          </div>

          {/* History Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Histórico de Retiradas</h3>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  value={vendedorSearch}
                  onChange={e => setVendedorSearch(e.target.value)}
                  placeholder="Pesquisar por vendedor ou cliente..."
                  className={`${inputCls(darkMode)} pl-8.5 py-2`}
                />
              </div>
            </div>

            <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-zinc-900/10 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b font-bold ${darkMode ? 'bg-zinc-950/40 border-white/5 text-zinc-400' : 'bg-slate-50/50 border-slate-200 text-zinc-500'}`}>
                      <th className="p-4">Data</th>
                      <th className="p-4">Vendedor</th>
                      <th className="p-4">Item</th>
                      <th className="p-4 text-center">Qtd</th>
                      <th className="p-4">Cliente/Destino</th>
                      <th className="p-4">Motivo</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBaixas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center font-medium text-zinc-405">
                          Nenhum registro de saída encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredBaixas.map(b => (
                        <tr key={b.id} className={`border-b ${darkMode ? 'border-white/5 text-zinc-300 hover:bg-white/5' : 'border-slate-100 text-zinc-700 hover:bg-slate-50'} transition-colors`}>
                          <td className="p-4 whitespace-nowrap font-medium">{formatDate(b.data)}</td>
                          <td className="p-4 whitespace-nowrap font-bold text-indigo-500">{b.vendedor}</td>
                          <td className="p-4 font-semibold">{b.itemName}</td>
                          <td className="p-4 text-center whitespace-nowrap font-extrabold">{b.quantidade}</td>
                          <td className="p-4 font-medium">{b.cliente}</td>
                          <td className="p-4 text-zinc-400 italic max-w-xs truncate" title={b.motivo}>{b.motivo || '-'}</td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteBaixa(b)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                              title="Estornar baixa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT 3: ITENS EM EVENTOS */}
      {activeSubTab === 'eventos' && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Extrato Consolidado por Eventos</h3>
            
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                value={eventSearch}
                onChange={e => setEventSearch(e.target.value)}
                placeholder="Pesquisar por item ou evento..."
                className={`${inputCls(darkMode)} pl-8.5 py-2`}
              />
            </div>
          </div>

          <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-zinc-900/10 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-bold ${darkMode ? 'bg-zinc-950/40 border-white/5 text-zinc-400' : 'bg-slate-50/50 border-slate-200 text-zinc-500'}`}>
                    <th className="p-4">Item</th>
                    <th className="p-4">Coleção</th>
                    <th className="p-4 text-center">Qtd Alocada</th>
                    <th className="p-4">Evento Vinculado</th>
                    <th className="p-4">Data Evento</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {eventGifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center font-medium text-zinc-405">
                        Nenhum brinde alocado em eventos localizado.
                      </td>
                    </tr>
                  ) : (
                    eventGifts.map(g => {
                      const isDelivered = g.eventStatus === 'Concluído';
                      return (
                        <tr key={g.id} className={`border-b ${darkMode ? 'border-white/5 text-zinc-300 hover:bg-white/5' : 'border-slate-100 text-zinc-700 hover:bg-slate-50'} transition-colors`}>
                          <td className="p-4 font-bold text-zinc-800 dark:text-zinc-100">{g.itemName}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${collectionColors[g.category] || 'bg-zinc-100 text-zinc-500'}`}>
                              {collectionLabels[g.category] || g.category}
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap font-extrabold">{g.quantidade}</td>
                          <td className="p-4 font-medium text-indigo-500">{g.eventName}</td>
                          <td className="p-4 whitespace-nowrap font-medium">{formatDate(g.eventDate)}</td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              g.eventStatus === 'Concluído' ? 'bg-emerald-500/10 text-emerald-500' :
                              g.eventStatus === 'Confirmado' ? 'bg-indigo-500/10 text-indigo-500' :
                              'bg-zinc-500/10 text-zinc-400'
                            }`}>
                              {g.eventStatus}
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            {isDelivered ? (
                              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3 shrink-0" />
                                <span>Entregue</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>Reservado</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Novo / Editar Item do Estoque */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity duration-300" onClick={closeModal} />
          <div className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border z-30 transition-all duration-300 ${
            shake ? 'animate-shake' : 'animate-spring-in'
          } ${darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-slate-200 text-zinc-900'}`}>
            <div className="px-6 py-5 border-b border-slate-200/40 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold font-display">{editing ? 'Editar Item' : 'Novo Item de Inventário'}</h3>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Nome do Item *</label>
                  <input 
                    value={form.nome} 
                    onChange={e => {
                      setForm({...form, nome: e.target.value});
                      if (errors.nome) setErrors(prev => ({ ...prev, nome: false }));
                    }} 
                    placeholder="Ex: Camiseta Preta M" 
                    className={`${inputCls(darkMode)} ${errors.nome ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5 dark:bg-rose-500/10' : ''}`} 
                  />
                </div>
                <div>
                  <label className={labelCls}>Tipo / Coleção</label>
                  <select value={form._collection} onChange={e => setForm({...form, _collection: e.target.value})} className={inputCls(darkMode)}>
                    <option value="inventario">Inventário</option>
                    <option value="brindes">Brindes</option>
                    <option value="uniformes">Uniformes</option>
                    <option value="estoque">Estoque</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Categoria</label>
                  <input value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} placeholder="Ex: Vestuário" className={inputCls(darkMode)} />
                </div>
                <div>
                  <label className={labelCls}>Quantidade</label>
                  <input type="number" value={form.quantidade} onChange={e => setForm({...form, quantidade: e.target.value})} placeholder="0" className={inputCls(darkMode)} />
                </div>
                <div>
                  <label className={labelCls}>Unidade</label>
                  <input value={form.unidade} onChange={e => setForm({...form, unidade: e.target.value})} placeholder="un, kg, cx..." className={inputCls(darkMode)} />
                </div>
                <div>
                  <label className={labelCls}>Custo Unitário (R$)</label>
                  <input type="number" step="0.01" value={form.custo_unitario} onChange={e => setForm({...form, custo_unitario: e.target.value})} placeholder="0.00" className={inputCls(darkMode)} />
                </div>
                <div>
                  <label className={labelCls}>Fornecedor</label>
                  <input value={form.fornecedor} onChange={e => setForm({...form, fornecedor: e.target.value})} placeholder="Nome do fornecedor" className={inputCls(darkMode)} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Descrição</label>
                  <textarea rows={3} value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} placeholder="Descrição detalhada do item..." className={`${inputCls(darkMode)} resize-none`} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-end space-x-3">
              <button onClick={closeModal} className={btnSecondary(darkMode)}>Cancelar</button>
              <button onClick={handleSave} className={btnPrimary}>Salvar Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────────
   FORNECEDORES TAB
───────────────────────────────────────────────────────────────── */
interface FornecedoresTabProps { darkMode: boolean; fornecedores: any[]; showToast: (m: string) => void; }

export function FornecedoresTab({ darkMode, fornecedores, showToast }: FornecedoresTabProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [shake, setShake] = useState(false);

  const [form, setForm] = useState({ nome: '', contato: '', email: '', telefone: '', tipo: '', website: '', observacoes: '', status: 'ativo' });

  const filtered = fornecedores.filter(f =>
    (f.nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.tipo || '').toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setErrors({});
    setShake(false);
    setForm({ nome: '', contato: '', email: '', telefone: '', tipo: '', website: '', observacoes: '', status: 'ativo' });
  };

  const handleSave = async () => {
    if (!form.nome) {
      setErrors({ nome: true });
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return showToast('Nome do fornecedor é obrigatório.');
    }
    if (editing) {
      await updateDoc(doc(db, 'fornecedores', editing.id), form);
      showToast('Fornecedor atualizado!');
    } else {
      await addDoc(collection(db, 'fornecedores'), { ...form, created_at: Timestamp.now() });
      showToast('Fornecedor cadastrado com sucesso!');
    }
    closeModal();
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setErrors({});
    setShake(false);
    setForm({ nome: item.nome || '', contato: item.contato || '', email: item.email || '', telefone: item.telefone || '', tipo: item.tipo || '', website: item.website || '', observacoes: item.observacoes || '', status: item.status || 'ativo' });
    setIsOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Excluir fornecedor "${item.nome}"?`)) return;
    await deleteDoc(doc(db, 'fornecedores', item.id));
    showToast('Fornecedor removido.');
  };

  const statusStyle: Record<string, string> = {
    ativo: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    inativo: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    pendente: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };

  return (
    <div className="w-full px-6 lg:px-12 xl:px-16 py-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
            <Truck className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Gestão de Fornecedores</h2>
            <p className="text-xs font-medium mt-0.5 text-zinc-500">{filtered.length} fornecedores</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(true)} className={btnPrimary}>
          <Plus className="h-4 w-4" /><span>Novo Fornecedor</span>
        </button>
      </div>

      {/* Search */}
      <div className={`flex gap-3 mb-6 p-4 rounded-2xl border ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar fornecedor..." className={`${inputCls(darkMode)} pl-9`} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {['ativo', 'pendente', 'inativo'].map(s => (
          <div key={s} className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-2xl font-black font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{fornecedores.filter(f => (f.status || 'ativo') === s).length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">{s}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          darkMode={darkMode}
          icon={Truck}
          title={search !== '' ? 'Nenhum fornecedor localizado' : 'Sem fornecedores cadastrados'}
          description={search !== '' ? `Não encontramos nenhum fornecedor correspondente a "${search}".` : 'Gerencie agências de viagens, hotéis e fornecedores de brindes em um único lugar.'}
          actionLabel="Novo Fornecedor"
          onAction={() => setIsOpen(true)}
          isFilterActive={search !== ''}
          onClearFilters={() => setSearch('')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className={`${cardCls(darkMode)} flex items-center justify-between gap-4`}>
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                  <Building className="h-4.5 w-4.5 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-sm font-display truncate ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{item.nome}</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${statusStyle[item.status || 'ativo']}`}>
                      {item.status || 'ativo'}
                    </span>
                    {item.tipo && <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold ${darkMode ? 'bg-zinc-800 border-white/5 text-zinc-400' : 'bg-slate-100 border-slate-200 text-zinc-600'}`}>{item.tipo}</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    {item.contato && <span className="flex items-center gap-1 text-[11px] text-zinc-400"><Users className="h-3 w-3" />{item.contato}</span>}
                    {item.telefone && <span className="flex items-center gap-1 text-[11px] text-zinc-400"><Phone className="h-3 w-3" />{item.telefone}</span>}
                    {item.email && <span className="flex items-center gap-1 text-[11px] text-zinc-400"><Mail className="h-3 w-3" />{item.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                {item.website && (
                  <a href={item.website} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-xl ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-slate-100'} transition-colors`}>
                    <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
                  </a>
                )}
                <button onClick={() => handleEdit(item)} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-slate-100'} transition-colors`}>
                  <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
                </button>
                <button onClick={() => handleDelete(item)} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'} transition-colors`}>
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity duration-300" onClick={closeModal} />
          <div className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border z-30 transition-all duration-300 ${
            shake ? 'animate-shake' : 'animate-spring-in'
          } ${darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-slate-200 text-zinc-900'}`}>
            <div className="px-6 py-5 border-b border-slate-200/40 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold font-display">{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Nome do Fornecedor *</label>
                  <input 
                    value={form.nome} 
                    onChange={e => {
                      setForm({...form, nome: e.target.value});
                      if (errors.nome) setErrors(prev => ({ ...prev, nome: false }));
                    }} 
                    placeholder="Razão social ou nome fantasia" 
                    className={`${inputCls(darkMode)} ${errors.nome ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5 dark:bg-rose-500/10' : ''}`} 
                  />
                </div>
                <div><label className={labelCls}>Tipo / Segmento</label><input value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} placeholder="Ex: Gráfica, Brindes..." className={inputCls(darkMode)} /></div>
                <div><label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inputCls(darkMode)}>
                    <option value="ativo">Ativo</option><option value="pendente">Pendente</option><option value="inativo">Inativo</option>
                  </select>
                </div>
                <div className="col-span-2"><label className={labelCls}>Contato / Responsável</label><input value={form.contato} onChange={e => setForm({...form, contato: e.target.value})} placeholder="Nome do contato principal" className={inputCls(darkMode)} /></div>
                <div><label className={labelCls}>Telefone</label><input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="(11) 99999-9999" className={inputCls(darkMode)} /></div>
                <div><label className={labelCls}>E-mail</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contato@empresa.com" className={inputCls(darkMode)} /></div>
                <div className="col-span-2"><label className={labelCls}>Website</label><input value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://..." className={inputCls(darkMode)} /></div>
                <div className="col-span-2"><label className={labelCls}>Observações</label><textarea rows={3} value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} className={`${inputCls(darkMode)} resize-none`} /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-end space-x-3">
              <button onClick={closeModal} className={btnSecondary(darkMode)}>Cancelar</button>
              <button onClick={handleSave} className={btnPrimary}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PARTICIPANTES TAB
───────────────────────────────────────────────────────────────── */
interface ParticipantesTabProps { darkMode: boolean; participantes: any[]; showToast: (m: string) => void; }

export function ParticipantesTab({ darkMode, participantes, showToast }: ParticipantesTabProps) {
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [shake, setShake] = useState(false);

  const [form, setForm] = useState({ nome: '', empresa: '', cargo: '', email: '', telefone: '', tipo: 'Cliente', evento_id: '', confirmado: false, observacoes: '', tamanho: 'M' });

  const filtered = participantes.filter(p => {
    const matchSearch = (p.nome || '').toLowerCase().includes(search.toLowerCase()) || (p.empresa || '').toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === 'todos' || p.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setErrors({});
    setShake(false);
    setForm({ nome: '', empresa: '', cargo: '', email: '', telefone: '', tipo: 'Cliente', evento_id: '', confirmado: false, observacoes: '', tamanho: 'M' });
  };

  const handleSave = async () => {
    if (!form.nome) {
      setErrors({ nome: true });
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return showToast('Nome é obrigatório.');
    }
    if (editing) {
      await updateDoc(doc(db, 'participantes', editing.id), form);
      showToast('Participante atualizado!');
    } else {
      await addDoc(collection(db, 'participantes'), { ...form, created_at: Timestamp.now() });
      showToast('Participante cadastrado!');
    }
    closeModal();
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setErrors({});
    setShake(false);
    setForm({ nome: item.nome || '', empresa: item.empresa || '', cargo: item.cargo || '', email: item.email || '', telefone: item.telefone || '', tipo: item.tipo || 'Cliente', evento_id: item.evento_id || '', confirmado: item.confirmado || false, observacoes: item.observacoes || '', tamanho: item.tamanho || 'M' });
    setIsOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Excluir "${item.nome}"?`)) return;
    await deleteDoc(doc(db, 'participantes', item.id));
    showToast('Participante removido.');
  };

  const tipoColors: Record<string, string> = {
    Cliente: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    VIP: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    Staff: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    Convidado: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };

  return (
    <div className="w-full px-6 lg:px-12 xl:px-16 py-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-100'}`}>
            <UserCheck className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Gestão de Participantes</h2>
            <p className="text-xs font-medium mt-0.5 text-zinc-500">{filtered.length} participantes</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(true)} className={btnPrimary}>
          <Plus className="h-4 w-4" /><span>Novo Participante</span>
        </button>
      </div>

      <div className={`flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-2xl border ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou empresa..." className={`${inputCls(darkMode)} pl-9`} />
        </div>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className={`${inputCls(darkMode)} w-full sm:w-48`}>
          <option value="todos">Todos os tipos</option>
          <option value="Cliente">Clientes</option>
          <option value="VIP">VIPs</option>
          <option value="Staff">Staff</option>
          <option value="Convidado">Convidados</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {['Cliente', 'VIP', 'Staff', 'Convidado'].map(t => (
          <div key={t} className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-2xl font-black font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{participantes.filter(p => p.tipo === t).length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">{t}s</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          darkMode={darkMode}
          icon={Users}
          title={search !== '' || filterTipo !== 'todos' ? 'Nenhum participante localizado' : 'Sem participantes cadastrados'}
          description={search !== '' || filterTipo !== 'todos' ? `Não encontramos participantes correspondentes aos filtros selecionados.` : 'Gerencie palestrantes, VIPs, convidados e equipe em seus eventos.'}
          actionLabel="Novo Participante"
          onAction={() => setIsOpen(true)}
          isFilterActive={search !== '' || filterTipo !== 'todos'}
          onClearFilters={() => { setSearch(''); setFilterTipo('todos'); }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className={cardCls(darkMode)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm font-display shrink-0 ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-zinc-700'}`}>
                    {(item.nome || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{item.nome}</h3>
                    {item.empresa && <p className="text-[11px] text-zinc-400">{item.cargo ? `${item.cargo} · ` : ''}{item.empresa}</p>}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => handleEdit(item)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-slate-100'}`}><Edit3 className="h-3 w-3 text-zinc-400" /></button>
                  <button onClick={() => handleDelete(item)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'}`}><Trash2 className="h-3 w-3 text-rose-400" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200/40 dark:border-white/5">
                <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${tipoColors[item.tipo] || 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                  {item.tipo || 'Participante'}
                </span>
                <span className={`text-[10px] font-bold flex items-center gap-1 ${item.confirmado ? 'text-emerald-500' : 'text-zinc-400'}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {item.confirmado ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
              {item.email && <p className="text-[10px] text-zinc-400 mt-2 flex items-center gap-1"><Mail className="h-3 w-3" />{item.email}</p>}
              {item.tamanho && <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1"><Package className="h-3 w-3" />Tamanho: {item.tamanho}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity duration-300" onClick={closeModal} />
          <div className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border z-30 transition-all duration-300 ${
            shake ? 'animate-shake' : 'animate-spring-in'
          } ${darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-slate-200 text-zinc-900'}`}>
            <div className="px-6 py-5 border-b border-slate-200/40 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold font-display">{editing ? 'Editar Participante' : 'Novo Participante'}</h3>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Nome Completo *</label>
                  <input 
                    value={form.nome} 
                    onChange={e => {
                      setForm({...form, nome: e.target.value});
                      if (errors.nome) setErrors(prev => ({ ...prev, nome: false }));
                    }} 
                    placeholder="Nome do participante" 
                    className={`${inputCls(darkMode)} ${errors.nome ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5 dark:bg-rose-500/10' : ''}`} 
                  />
                </div>
                <div><label className={labelCls}>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className={inputCls(darkMode)}>
                    <option>Cliente</option><option>VIP</option><option>Staff</option><option>Convidado</option>
                  </select>
                </div>
                <div><label className={labelCls}>Cargo</label><input value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} placeholder="Ex: Gerente" className={inputCls(darkMode)} /></div>
                <div className="col-span-2"><label className={labelCls}>Empresa</label><input value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} placeholder="Nome da empresa" className={inputCls(darkMode)} /></div>
                <div><label className={labelCls}>E-mail</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@empresa.com" className={inputCls(darkMode)} /></div>
                <div><label className={labelCls}>Telefone</label><input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="(11) 99999-9999" className={inputCls(darkMode)} /></div>
                <div><label className={labelCls}>Tamanho de Camiseta</label>
                  <select value={form.tamanho || 'M'} onChange={e => setForm({...form, tamanho: e.target.value})} className={inputCls(darkMode)}>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                    <option value="XG">XG</option>
                    <option value="Baby Look P">Baby Look P</option>
                    <option value="Baby Look M">Baby Look M</option>
                    <option value="Baby Look G">Baby Look G</option>
                    <option value="Baby Look GG">Baby Look GG</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-center space-x-3">
                  <input type="checkbox" id="confirmado" checked={form.confirmado} onChange={e => setForm({...form, confirmado: e.target.checked})} className="h-5 w-5 rounded text-indigo-600" />
                  <label htmlFor="confirmado" className="text-[11px] font-bold uppercase text-zinc-500 cursor-pointer">Presença Confirmada</label>
                </div>
                <div className="col-span-2"><label className={labelCls}>Observações</label><textarea rows={3} value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} className={`${inputCls(darkMode)} resize-none`} /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-end space-x-3">
              <button onClick={closeModal} className={btnSecondary(darkMode)}>Cancelar</button>
              <button onClick={handleSave} className={btnPrimary}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   VIAGENS TAB
───────────────────────────────────────────────────────────────── */
interface ViagensTabProps { darkMode: boolean; viagens: any[]; showToast: (m: string) => void; }

export function ViagensTab({ darkMode, viagens, showToast }: ViagensTabProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [shake, setShake] = useState(false);

  const [form, setForm] = useState({ destino: '', origem: '', data_ida: '', data_volta: '', passageiro: '', tipo_transporte: 'Aéreo', hotel: '', custo_passagem: '', custo_hospedagem: '', custo_total: '', status: 'planejada', observacoes: '', evento_relacionado: '' });

  const filtered = viagens.filter(v =>
    (v.destino || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.passageiro || '').toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setErrors({});
    setShake(false);
    setForm({ destino: '', origem: '', data_ida: '', data_volta: '', passageiro: '', tipo_transporte: 'Aéreo', hotel: '', custo_passagem: '', custo_hospedagem: '', custo_total: '', status: 'planejada', observacoes: '', evento_relacionado: '' });
  };

  const handleSave = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.destino) newErrors.destino = true;
    if (!form.passageiro) newErrors.passageiro = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return showToast('Destino e Passageiro são obrigatórios.');
    }

    const payload = { ...form, custo_passagem: parseFloat(form.custo_passagem) || 0, custo_hospedagem: parseFloat(form.custo_hospedagem) || 0, custo_total: parseFloat(form.custo_total) || 0 };
    if (editing) {
      await updateDoc(doc(db, 'viagens', editing.id), payload);
      showToast('Viagem updated successfully!');
    } else {
      await addDoc(collection(db, 'viagens'), { ...payload, created_at: Timestamp.now() });
      showToast('Viagem registered successfully!');
    }
    closeModal();
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setErrors({});
    setShake(false);
    setForm({ destino: item.destino || '', origem: item.origem || '', data_ida: item.data_ida || '', data_volta: item.data_volta || '', passageiro: item.passageiro || '', tipo_transporte: item.tipo_transporte || 'Aéreo', hotel: item.hotel || '', custo_passagem: item.custo_passagem?.toString() || '', custo_hospedagem: item.custo_hospedagem?.toString() || '', custo_total: item.custo_total?.toString() || '', status: item.status || 'planejada', observacoes: item.observacoes || '', evento_relacionado: item.evento_relacionado || '' });
    setIsOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Excluir viagem para "${item.destino}"?`)) return;
    await deleteDoc(doc(db, 'viagens', item.id));
    showToast('Viagem removida.');
  };

  const statusStyle: Record<string, string> = {
    planejada: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    confirmada: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    concluida: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    cancelada: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  const totalCustos = filtered.reduce((acc, v) => acc + (v.custo_total || 0), 0);

  return (
    <div className="w-full px-6 lg:px-12 xl:px-16 py-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-sky-500/10 border border-sky-500/20' : 'bg-sky-50 border border-sky-100'}`}>
            <Plane className="h-5 w-5 text-sky-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Gestão de Viagens</h2>
            <p className="text-xs font-medium mt-0.5 text-zinc-500">{filtered.length} viagens · Total: <span className="text-emerald-500 font-bold">R$ {totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
          </div>
        </div>
        <button onClick={() => setIsOpen(true)} className={btnPrimary}>
          <Plus className="h-4 w-4" /><span>Nova Viagem</span>
        </button>
      </div>

      <div className={`flex gap-3 mb-6 p-4 rounded-2xl border ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por destino ou passageiro..." className={`${inputCls(darkMode)} pl-9`} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {['planejada', 'confirmada', 'concluida', 'cancelada'].map(s => (
          <div key={s} className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-2xl font-black font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{viagens.filter(v => (v.status || 'planejada') === s).length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">{s}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          darkMode={darkMode}
          icon={Plane}
          title={search !== '' ? 'Nenhuma viagem localizada' : 'Sem viagens registradas'}
          description={search !== '' ? `Não encontramos viagens correspondentes a "${search}".` : 'Controle voos, traslados, hospedagens e horários de chegada e saída.'}
          actionLabel="Nova Viagem"
          onAction={() => setIsOpen(true)}
          isFilterActive={search !== ''}
          onClearFilters={() => setSearch('')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className={`${cardCls(darkMode)} flex items-center justify-between gap-4`}>
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-sky-500/10' : 'bg-sky-50'}`}>
                  <Plane className="h-5 w-5 text-sky-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className={`font-bold text-sm font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {item.origem ? `${item.origem} → ` : ''}{item.destino}
                    </h3>
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${statusStyle[item.status || 'planejada']}`}>
                      {item.status || 'planejada'}
                    </span>
                    {item.tipo_transporte && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold ${darkMode ? 'bg-zinc-800 border-white/5 text-zinc-400' : 'bg-slate-100 border-slate-200 text-zinc-600'}`}>
                        {item.tipo_transporte}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {item.passageiro && <span className="flex items-center gap-1 text-[11px] text-zinc-400"><UserCheck className="h-3 w-3" />{item.passageiro}</span>}
                    {item.data_ida && <span className="flex items-center gap-1 text-[11px] text-zinc-400"><Calendar className="h-3 w-3" />{item.data_ida}{item.data_volta ? ` → ${item.data_volta}` : ''}</span>}
                    {item.hotel && <span className="flex items-center gap-1 text-[11px] text-zinc-400"><Hotel className="h-3 w-3" />{item.hotel}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 shrink-0">
                {item.custo_total > 0 && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-bold uppercase text-zinc-400">Custo Total</p>
                    <p className="text-sm font-bold text-emerald-500">R$ {Number(item.custo_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                )}
                <button onClick={() => handleEdit(item)} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-slate-100'} transition-colors`}><Edit3 className="h-3.5 w-3.5 text-zinc-400" /></button>
                <button onClick={() => handleDelete(item)} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'} transition-colors`}><Trash2 className="h-3.5 w-3.5 text-rose-400" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity duration-300" onClick={closeModal} />
          <div className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border z-30 transition-all duration-300 ${
            shake ? 'animate-shake' : 'animate-spring-in'
          } ${darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-slate-200 text-zinc-900'}`}>
            <div className="px-6 py-5 border-b border-slate-200/40 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold font-display">{editing ? 'Editar Viagem' : 'Nova Viagem'}</h3>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Origem</label><input value={form.origem} onChange={e => setForm({...form, origem: e.target.value})} placeholder="Ex: São Paulo" className={inputCls(darkMode)} /></div>
                <div>
                  <label className={labelCls}>Destino *</label>
                  <input 
                    value={form.destino} 
                    onChange={e => {
                      setForm({...form, destino: e.target.value});
                      if (errors.destino) setErrors(prev => ({ ...prev, destino: false }));
                    }} 
                    placeholder="Ex: Belo Horizonte" 
                    className={`${inputCls(darkMode)} ${errors.destino ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5 dark:bg-rose-500/10' : ''}`} 
                  />
                </div>
                <div><label className={labelCls}>Data de Ida</label><input type="date" value={form.data_ida} onChange={e => setForm({...form, data_ida: e.target.value})} className={inputCls(darkMode)} /></div>
                <div><label className={labelCls}>Data de Volta</label><input type="date" value={form.data_volta} onChange={e => setForm({...form, data_volta: e.target.value})} className={inputCls(darkMode)} /></div>
                <div className="col-span-2">
                  <label className={labelCls}>Passageiro *</label>
                  <input 
                    value={form.passageiro} 
                    onChange={e => {
                      setForm({...form, passageiro: e.target.value});
                      if (errors.passageiro) setErrors(prev => ({ ...prev, passageiro: false }));
                    }} 
                    placeholder="Nome do viajante" 
                    className={`${inputCls(darkMode)} ${errors.passageiro ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5 dark:bg-rose-500/10' : ''}`} 
                  />
                </div>
                <div><label className={labelCls}>Transporte</label>
                  <select value={form.tipo_transporte} onChange={e => setForm({...form, tipo_transporte: e.target.value})} className={inputCls(darkMode)}>
                    <option>Aéreo</option><option>Rodoviário</option><option>Carro</option><option>Trem</option>
                  </select>
                </div>
                <div><label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inputCls(darkMode)}>
                    <option value="planejada">Planejada</option><option value="confirmada">Confirmada</option><option value="concluida">Concluída</option><option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div className="col-span-2"><label className={labelCls}>Hotel / Hospedagem</label><input value={form.hotel} onChange={e => setForm({...form, hotel: e.target.value})} placeholder="Nome do hotel" className={inputCls(darkMode)} /></div>
                <div><label className={labelCls}>Custo Passagem (R$)</label><input type="number" value={form.custo_passagem} onChange={e => setForm({...form, custo_passagem: e.target.value})} placeholder="0.00" className={inputCls(darkMode)} /></div>
                <div><label className={labelCls}>Custo Hospedagem (R$)</label><input type="number" value={form.custo_hospedagem} onChange={e => setForm({...form, custo_hospedagem: e.target.value})} placeholder="0.00" className={inputCls(darkMode)} /></div>
                <div className="col-span-2"><label className={labelCls}>Custo Total (R$)</label><input type="number" value={form.custo_total} onChange={e => setForm({...form, custo_total: e.target.value})} placeholder="0.00" className={inputCls(darkMode)} /></div>
                <div className="col-span-2"><label className={labelCls}>Evento Relacionado</label><input value={form.evento_relacionado} onChange={e => setForm({...form, evento_relacionado: e.target.value})} placeholder="Nome ou ID do evento" className={inputCls(darkMode)} /></div>
                <div className="col-span-2"><label className={labelCls}>Observações</label><textarea rows={3} value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} className={`${inputCls(darkMode)} resize-none`} /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-end space-x-3">
              <button onClick={closeModal} className={btnSecondary(darkMode)}>Cancelar</button>
              <button onClick={handleSave} className={btnPrimary}>Salvar Viagem</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   EVENTOS / PROJETOS TAB
───────────────────────────────────────────────────────────────── */
interface EventosTabProps {
  darkMode: boolean;
  events: any[];
  onEditEvent?: (event: any) => void;
  onDeleteEvent?: (eventId: string) => void;
  onAddEvent?: () => void;
  showToast: (m: string) => void;
}

export function EventosTab({ darkMode, events, onEditEvent, onDeleteEvent, onAddEvent, showToast }: EventosTabProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');

  const filtered = events.filter(e => {
    const matchSearch = (e.title || '').toLowerCase().includes(search.toLowerCase()) || 
                        (e.host || '').toLowerCase().includes(search.toLowerCase()) ||
                        (e.location || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'todos' || e.category === filterCategory;
    const matchStatus = filterStatus === 'todos' || e.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const categoryOptions = Array.from(new Set(events.map(e => e.category).filter(Boolean)));
  const statusOptions = Array.from(new Set(events.map(e => e.status).filter(Boolean)));

  const statusColors: Record<string, string> = {
    'concluído': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'confirmado': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    'planejado': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'em negociação': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <div className="w-full px-6 lg:px-12 xl:px-16 py-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
            <Calendar className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Gestão de Projetos / Eventos</h2>
            <p className="text-xs font-medium mt-0.5 text-zinc-500">{filtered.length} eventos listados</p>
          </div>
        </div>
        {onAddEvent && (
          <button onClick={onAddEvent} className={btnPrimary}>
            <Plus className="h-4 w-4" /><span>Novo Evento</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-2xl border ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título, responsável ou local..." className={`${inputCls(darkMode)} pl-9`} />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={`${inputCls(darkMode)} w-full sm:w-48`}>
          <option value="todos">Todas as Categorias</option>
          {categoryOptions.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${inputCls(darkMode)} w-full sm:w-48`}>
          <option value="todos">Todos os Status</option>
          {statusOptions.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      {/* Events Table List */}
      <div className={`border rounded-3xl overflow-hidden ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className={`border-b text-[10px] font-bold uppercase tracking-wider text-zinc-400 ${darkMode ? 'border-white/5 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <th className="py-4 px-6">Data / Título</th>
                <th className="py-4 px-6">Categoria</th>
                <th className="py-4 px-6">Responsável</th>
                <th className="py-4 px-6">Local / Formato</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      darkMode={darkMode}
                      icon={Calendar}
                      title={search !== '' || filterCategory !== 'todos' || filterStatus !== 'todos' ? 'Nenhum evento localizado' : 'Sem eventos cadastrados'}
                      description={search !== '' || filterCategory !== 'todos' || filterStatus !== 'todos' ? 'Não encontramos eventos correspondentes aos filtros ativos.' : 'Crie novos eventos no calendário para começar a gerenciar sua pauta.'}
                      actionLabel="Novo Evento"
                      onAction={onAddEvent}
                      isFilterActive={search !== '' || filterCategory !== 'todos' || filterStatus !== 'todos'}
                      onClearFilters={() => { setSearch(''); setFilterCategory('todos'); setFilterStatus('todos'); }}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(event => {
                  const dateStr = event.date?.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) || '--';
                  return (
                    <tr key={event.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-zinc-900 dark:text-zinc-150">{event.title}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{dateStr}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                          darkMode ? 'bg-zinc-800 text-zinc-350 border-white/5' : 'bg-slate-100 text-zinc-700 border-slate-200'
                        }`}>
                          {event.category || 'Pauta Geral'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-zinc-650 dark:text-zinc-300">
                        {event.host || 'Sem Responsável'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-zinc-700 dark:text-zinc-300">{event.location}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Formato: {event.format || 'Híbrido'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                          statusColors[event.status] || 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>
                          {event.status || 'planejado'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                        <button 
                          onClick={() => onEditEvent?.(event)}
                          className={`p-2 rounded-xl transition-all inline-flex items-center justify-center ${
                            darkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-zinc-700'
                          }`}
                          title="Editar Evento"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteEvent?.(event.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all inline-flex items-center justify-center"
                          title="Excluir Evento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DASHBOARD FINANCEIRO TAB
   ───────────────────────────────────────────────────────────────── */
interface FinanceiroTabProps {
  darkMode: boolean;
  events: any[];
  onEditEvent?: (event: any) => void;
  onViewEvent?: (event: any) => void;
  showToast: (m: string) => void;
}

export function FinanceiroTab({ darkMode, events, onEditEvent, onViewEvent, showToast }: FinanceiroTabProps) {
  const [search, setSearch] = useState('');
  const [filterTipoFinanceiro, setFilterTipoFinanceiro] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');

  // Filter logic: search by event title or UF
  const filtered = events.filter(e => {
    const searchLower = search.toLowerCase().trim();
    const matchSearch = !searchLower || 
                        (e.title || '').toLowerCase().includes(searchLower) || 
                        (e.uf || '').toLowerCase().includes(searchLower);
    
    const matchTipoFin = filterTipoFinanceiro === 'todos' || e.tipo_financeiro === filterTipoFinanceiro;
    const matchStatus = filterStatus === 'todos' || (e.status || '').toLowerCase() === filterStatus.toLowerCase();

    return matchSearch && matchTipoFin && matchStatus;
  });

  // Extract unique options from events for dropdowns
  const tipoFinanceiroOptions = Array.from(new Set(events.map(e => e.tipo_financeiro).filter(Boolean)));
  const statusOptions = Array.from(new Set(events.map(e => e.status).filter(Boolean)));

  // Helper to parse numbers robustly (handles strings like "R$ 1.250,00" or raw numbers)
  const parseNumber = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const clean = val.replace(/[R$\s]/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Summaries
  const totalCustoReal = filtered.reduce((acc, e) => acc + parseNumber(e.custo_real), 0);
  const totalPrevisaoPipe = filtered.reduce((acc, e) => acc + parseNumber(e.previsao_pipe), 0);
  const totalPrevisaoFechamento = filtered.reduce((acc, e) => acc + parseNumber(e.previsao_fechamento), 0);
  const totalReceitaEstimada = filtered.reduce((acc, e) => acc + parseNumber(e.receita_estimada), 0);

  // Currency Formatter helper
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="w-full px-6 lg:px-12 xl:px-16 py-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
            <DollarSign className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Painel Financeiro</h2>
            <p className="text-xs font-medium mt-0.5 text-zinc-500">{filtered.length} eventos filtrados</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className={`flex flex-col sm:flex-row items-center gap-4 mb-6 p-4 rounded-2xl border ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por evento ou UF..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs font-semibold outline-none transition-all focus:ring-2 focus:ring-indigo-500/10 ${
              darkMode
                ? 'bg-zinc-900/40 border-white/5 text-white focus:border-indigo-500 placeholder-zinc-650'
                : 'bg-slate-50 border-slate-200 text-zinc-800 focus:border-indigo-500 placeholder-slate-400'
            }`}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Tipo:</span>
            <select
              value={filterTipoFinanceiro}
              onChange={e => setFilterTipoFinanceiro(e.target.value)}
              className={`text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none cursor-pointer transition-all w-full sm:w-40 ${
                darkMode ? 'bg-zinc-955 border-white/5 text-zinc-300 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-zinc-700 focus:border-indigo-500'
              }`}
            >
              <option value="todos">Todos</option>
              {tipoFinanceiroOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={`text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none cursor-pointer transition-all w-full sm:w-40 ${
                darkMode ? 'bg-zinc-955 border-white/5 text-zinc-300 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-zinc-700 focus:border-indigo-500'
              }`}
            >
              <option value="todos">Status (Todos)</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card: Custo Real Total */}
        <div className={`p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden ${
          darkMode ? 'bg-zinc-900/40 border-white/5 shadow-black/20' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Custo Real Total</h3>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-55 text-blue-500'
            }`}>
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xs font-bold text-blue-550 dark:text-blue-400">R$</span>
            <span className="text-2xl font-black font-display tracking-tight text-blue-600 dark:text-blue-400 leading-none">
              {formatCurrency(totalCustoReal)}
            </span>
          </div>
        </div>

        {/* Card: Previsão de Pipe */}
        <div className={`p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden ${
          darkMode ? 'bg-zinc-900/40 border-white/5 shadow-black/20' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Previsão de Pipe (X200)</h3>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-zinc-650'
            }`}>
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xs font-bold text-zinc-400">R$</span>
            <span className="text-2xl font-black font-display tracking-tight text-zinc-800 dark:text-white leading-none">
              {formatCurrency(totalPrevisaoPipe)}
            </span>
          </div>
        </div>

        {/* Card: Prev. Fechamento 15% */}
        <div className={`p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden ${
          darkMode ? 'bg-zinc-900/40 border-white/5 shadow-black/20' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Prev. Fechamento 15%</h3>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-550'
            }`}>
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xs font-bold text-purple-550 dark:text-purple-400">R$</span>
            <span className="text-2xl font-black font-display tracking-tight text-purple-600 dark:text-purple-400 leading-none">
              {formatCurrency(totalPrevisaoFechamento)}
            </span>
          </div>
        </div>

        {/* Card: Receita Líquida Estimada */}
        <div className={`p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden ${
          darkMode ? 'bg-zinc-900/40 border-white/5 shadow-black/20' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Receita Líquida Estimada</h3>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-505'
            }`}>
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xs font-bold text-emerald-505 dark:text-emerald-400">R$</span>
            <span className="text-2xl font-black font-display tracking-tight text-emerald-600 dark:text-emerald-500 leading-none">
              {formatCurrency(totalReceitaEstimada)}
            </span>
          </div>
        </div>

      </div>

      {/* Events Financial List */}
      <div className={`border rounded-[32px] overflow-hidden ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-medium">
            <thead>
              <tr className={`border-b text-[10px] font-bold uppercase tracking-wider text-zinc-400 ${darkMode ? 'border-white/5 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <th className="py-4.5 px-6">Evento</th>
                <th className="py-4.5 px-6">Data</th>
                <th className="py-4.5 px-6">UF</th>
                <th className="py-4.5 px-6">Tipo Financeiro</th>
                <th className="py-4.5 px-6">Apuração Finalizada?</th>
                <th className="py-4.5 px-6 text-right">Custo Real (R$)</th>
                <th className="py-4.5 px-6 text-right">Prev. Pipe (R$)</th>
                <th className="py-4.5 px-6 text-right">Prev. Fech. (R$)</th>
                <th className="py-4.5 px-6 text-right">Receita Est. (R$)</th>
                <th className="py-4.5 px-6 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-zinc-400">
                    Nenhum evento financeiro localizado.
                  </td>
                </tr>
              ) : (
                filtered.map(event => {
                  const dateStr = event.date instanceof Date 
                    ? event.date.toLocaleDateString('pt-BR') 
                    : '--';

                  return (
                    <tr key={event.id} className="hover:bg-slate-500/5 transition-colors">
                      {/* EVENTO */}
                      <td className="py-4.5 px-6 font-bold text-zinc-800 dark:text-zinc-150 max-w-[200px] truncate" title={event.title}>
                        {event.title}
                      </td>

                      {/* DATA */}
                      <td className="py-4.5 px-6 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* UF */}
                      <td className="py-4.5 px-6 text-zinc-550 dark:text-zinc-300 font-semibold">
                        {event.uf || '--'}
                      </td>

                      {/* TIPO FINANCEIRO */}
                      <td className="py-4.5 px-6 text-zinc-550 dark:text-zinc-300 font-medium">
                        {event.tipo_financeiro || '--'}
                      </td>

                      {/* APURAÇÃO FINALIZADA */}
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          event.apuracao_finalizada 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' 
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/25'
                        }`}>
                          {event.apuracao_finalizada ? 'SIM' : 'NÃO'}
                        </span>
                      </td>

                      {/* CUSTO REAL */}
                      <td className="py-4.5 px-6 text-right font-bold text-zinc-750 dark:text-zinc-200">
                        R$ {formatCurrency(parseNumber(event.custo_real))}
                      </td>

                      {/* PREV. PIPE */}
                      <td className="py-4.5 px-6 text-right font-medium text-zinc-550 dark:text-zinc-400">
                        R$ {formatCurrency(parseNumber(event.previsao_pipe))}
                      </td>

                      {/* PREV. FECH. */}
                      <td className="py-4.5 px-6 text-right font-bold text-purple-600 dark:text-purple-400">
                        R$ {formatCurrency(parseNumber(event.previsao_fechamento))}
                      </td>

                      {/* RECEITA EST. */}
                      <td className="py-4.5 px-6 text-right font-extrabold text-emerald-600 dark:text-emerald-505 font-sans">
                        R$ {formatCurrency(parseNumber(event.receita_estimada))}
                      </td>

                      {/* AÇÕES */}
                      <td className="py-4.5 px-6 text-center space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onViewEvent?.(event)}
                          className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-all inline-flex items-center justify-center cursor-pointer border border-transparent"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onEditEvent?.(event)}
                          className={`p-2 rounded-xl transition-all inline-flex items-center justify-center ${
                            darkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-zinc-700'
                          }`}
                          title="Editar Evento"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface TutorialTabProps {
  darkMode: boolean;
}

export function TutorialTab({ darkMode }: TutorialTabProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const categories = [
    {
      id: 'eventos',
      title: 'Gestão de Eventos / Pautas',
      desc: 'Como cadastrar, planejar, alocar brindes e obter sourcing automático do Google AI Studio.',
      icon: Calendar,
      color: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      steps: [
        {
          id: 'ev-1',
          title: 'Abrir o Formulário de Criação',
          desc: 'Clique em "Adicionar Pauta" no calendário geral ou em "Registrar Pauta / Evento" no topo do Painel Admin para abrir o formulário.',
          tip: 'Campos marcados com asterisco (*) como "Nome do Evento", "Categoria" e "Data Inicial" são de preenchimento obrigatório.'
        },
        {
          id: 'ev-2',
          title: 'Sourcing Automático com Inteligência Artificial',
          desc: 'Para acelerar o preenchimento, digite o nome do evento e clique em "Buscar no Google" ao lado do campo do título. A ferramenta buscará automaticamente informações como Público-Alvo, Descrição, Localização e Imagens relacionadas.',
          tip: 'Verifique as informações buscadas antes de salvar para garantir que estão alinhadas com as diretrizes do evento.'
        },
        {
          id: 'ev-3',
          title: 'Alocação de Brindes e Logística',
          desc: 'Navegue até a aba "Logística & Listas" dentro do modal de eventos. Selecione a quantidade e os itens de estoque (brindes, uniformes) que serão destinados a esse evento.',
          warning: 'Esta ação criará uma reserva automática no estoque, e os itens constarão como "Reservados" até a conclusão do evento.'
        },
        {
          id: 'ev-4',
          title: 'Salvar e Acompanhar Status',
          desc: 'Escolha o status do evento (planejado, confirmado, concluído) e clique em "Confirmar". O evento aparecerá imediatamente no calendário corporativo.',
          tip: 'Quando o evento mudar de status para "Concluído", a reserva no estoque é automaticamente confirmada como baixada ("Entregue").'
        }
      ]
    },
    {
      id: 'financeiro',
      title: 'Gestão Financeira V2',
      desc: 'Controle de orçamentos aprovados, extratos detalhados de despesas e importação de planilhas Excel.',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      steps: [
        {
          id: 'fin-1',
          title: 'Definir o Orçamento (Budget) do Evento',
          desc: 'Ao criar ou editar um evento, acesse a aba "Financeiro". Defina o campo "Orçamento Total" para estabelecer o limite financeiro do projeto.',
          tip: 'Essa aba está disponível apenas para administradores (Role Admin) e não é exibida para outros usuários.'
        },
        {
          id: 'fin-2',
          title: 'Inserir Lançamentos Manuais',
          desc: 'Adicione despesas manuais especificando a Conta, Data de Lançamento, Data de Vencimento, Fornecedor, Descrição e o Valor em R$.',
          tip: 'O "Custo Real" do evento é calculado dinamicamente pela somatória de todos os lançamentos de despesas.'
        },
        {
          id: 'fin-3',
          title: 'Importar Planilha Excel',
          desc: 'Clique em "Importar Excel" na aba "Financeiro" e faça o upload de uma planilha de gastos. O sistema lerá as colunas de gastos e as importará automaticamente.',
          warning: 'Se o Excel possuir múltiplas abas, o sistema abrirá um seletor para você escolher qual aba corresponde a este evento antes de confirmar.'
        },
        {
          id: 'fin-4',
          title: 'Análise de Orçamento vs Custo Real',
          desc: 'Visualize o custo real consolidado na tela de detalhes do evento ou no dashboard financeiro principal.',
          warning: 'Se o Custo Real ultrapassar o Orçamento Aprovado, o valor final ficará destacado em vermelho como aviso visual de estouro de budget.'
        }
      ]
    },
    {
      id: 'estoque',
      title: 'Estoque & Retiradas V5',
      desc: 'Gerenciamento de saldo atual, saídas para vendedores em reuniões e reversão/estorno de baixas.',
      icon: Package,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      steps: [
        {
          id: 'est-1',
          title: 'Cadastrar e Monitorar Itens',
          desc: 'Acesse a aba "Estoque Atual" no painel. Adicione novos brindes ou uniformes especificando Nome, Categoria (brindes, uniformes, etc.), Quantidade e Custo Unitário.',
          tip: 'O sistema exibe o valor financeiro do inventário (Saldo × Custo) e destaca com alerta amarelo itens com baixo estoque (<= 5 unidades).'
        },
        {
          id: 'est-2',
          title: 'Lançar Saídas para Vendedores (Baixas)',
          desc: 'Na aba "Saídas para Vendedores", use o formulário para registrar a retirada de brindes por consultores comerciais para reuniões corporativas.',
          warning: 'O sistema valida a retirada em tempo real e não permitirá dar baixa de uma quantidade maior que o saldo disponível em estoque.'
        },
        {
          id: 'est-3',
          title: 'Histórico de Retiradas e Estorno (Reversão)',
          desc: 'Acompanhe todas as saídas na tabela de histórico de vendedores. Se a reunião for cancelada ou houver erro no lançamento, clique em "Estornar" (ícone de lixeira no histórico).',
          tip: 'O estorno remove a baixa comercial do banco e devolve imediatamente as quantidades correspondentes de volta ao estoque do item.'
        },
        {
          id: 'est-4',
          title: 'Rastrear Itens Vinculados a Eventos',
          desc: 'Na aba "Itens em Eventos", veja uma tabela consolidada de todos os brindes alocados em eventos gerais com data e badge de situação.',
          tip: 'Badge "Reservado" indica que o item está separado para um evento futuro. Badge "Entregue" indica que o evento foi concluído e o saldo foi baixado.'
        }
      ]
    },
    {
      id: 'usuarios',
      title: 'Controle de Usuários & Acessos',
      desc: 'Gerenciamento de novas contas, atribuição de privilégios (Admin / Approved) e remoção de usuários.',
      icon: Users,
      color: 'from-violet-500 to-purple-500',
      textColor: 'text-violet-500 dark:text-violet-400',
      bgColor: 'bg-violet-500/10',
      steps: [
        {
          id: 'usr-1',
          title: 'Fluxo de Entrada de Usuários',
          desc: 'Ao se cadastrar, todo novo colaborador entra com a função padrão "pending" (Pendente), ficando bloqueado de ver o calendário geral de pautas.',
          tip: 'Isto evita que pessoas não autorizadas acessem os cronogramas de marketing da empresa.'
        },
        {
          id: 'usr-2',
          title: 'Aprovação e Níveis de Acesso',
          desc: 'Na aba "Usuários", localize o usuário pendente na tabela e altere seu perfil (Role): "Approved" (Aprovado - acesso geral de leitura e edição comum) ou "Admin" (Administrador - acesso total, financeiro e painel administrativo).',
          warning: 'Qualquer alteração de role é gravada no Firestore e reflete imediatamente no navegador do colaborador.'
        },
        {
          id: 'usr-3',
          title: 'Exclusão de Contas',
          desc: 'Se um colaborador for desligado da empresa ou cadastrado por engano, você pode clicar no botão "Excluir" (ícone de lixeira) ao lado do perfil dele na tabela de usuários.',
          warning: 'Esta ação exclui permanentemente o registro de acesso do usuário no banco de dados. Confirme com cuidado.'
        }
      ]
    }
  ];

  const handleToggleCategory = (catId: string) => {
    if (activeCategory === catId) {
      setActiveCategory(null);
      setExpandedStep(null);
    } else {
      setActiveCategory(catId);
      setExpandedStep(null);
    }
  };

  const handleToggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* HEADER */}
      <div className="flex items-center space-x-3 pb-6 border-b border-slate-200/40 dark:border-white/5">
        <div className={`p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500`}>
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h2 className={`text-xl font-bold font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
            Manual do Administrador
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Guia passo a passo interativo de todas as ferramentas e fluxos exclusivos do painel administrativo.
          </p>
        </div>
      </div>

      {/* BENTO GRID OF CATEGORIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat) => {
          const IconComponent = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => handleToggleCategory(cat.id)}
              className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                isSelected
                  ? `h-fit border-indigo-500/30 ${darkMode ? 'bg-zinc-905/80' : 'bg-slate-50/90 shadow-md shadow-indigo-500/5'}`
                  : `h-36 ${
                      darkMode
                        ? 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/55 shadow-sm'
                    }`
              }`}
            >
              {/* Abstract decorative shape in background */}
              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-xl bg-gradient-to-br ${cat.color} group-hover:scale-125 transition-transform duration-500`} />

              <div className="space-y-6 relative z-10 w-full">
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${cat.bgColor} ${cat.textColor} shrink-0`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold tracking-tight ${darkMode ? 'text-zinc-100' : 'text-zinc-850'}`}>
                        {cat.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed font-normal">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${
                    isSelected
                      ? 'bg-indigo-500/15 text-indigo-500'
                      : darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-zinc-500'
                  }`}>
                    {isSelected ? 'Fechar' : 'Visualizar'}
                  </span>
                </div>

                {/* Accordion steps rendered INSIDE the card */}
                {isSelected && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="space-y-3 pt-6 border-t border-slate-200/50 dark:border-white/5 cursor-default w-full"
                  >
                    <div className="space-y-3">
                      {cat.steps.map((step, idx) => {
                        const isStepExpanded = expandedStep === step.id;
                        return (
                          <div
                            key={step.id}
                            className={`rounded-2xl border transition-all overflow-hidden ${
                              isStepExpanded
                                ? darkMode
                                  ? 'bg-zinc-950 border-indigo-500/20 shadow-lg'
                                  : 'bg-white border-slate-300 shadow-md'
                                : darkMode
                                  ? 'bg-zinc-900/80 border-white/5 hover:bg-zinc-900'
                                  : 'bg-white border-slate-205 hover:bg-slate-50/80 shadow-sm'
                            }`}
                          >
                            {/* Header trigger */}
                            <button
                              type="button"
                              onClick={() => handleToggleStep(step.id)}
                              className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
                            >
                              <div className="flex items-center space-x-3">
                                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md ${
                                  darkMode ? 'bg-zinc-850 text-indigo-400' : 'bg-slate-100 text-indigo-650'
                                }`}>
                                  Passo {idx + 1}
                                </span>
                                <span className={`text-xs font-bold ${darkMode ? 'text-zinc-200' : 'text-zinc-805'}`}>
                                  {step.title}
                                </span>
                              </div>
                              {isStepExpanded ? (
                                <ChevronUp className="h-4 w-4 text-zinc-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-zinc-400" />
                              )}
                            </button>

                            {/* Content */}
                            {isStepExpanded && (
                              <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-200/30 dark:border-white/5 animate-fade-in">
                                <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-normal">
                                  {step.desc}
                                </p>

                                {/* Optional custom visual Callout boxes (Tip or Warning) */}
                                {step.tip && (
                                  <div className="p-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 flex items-start space-x-2.5">
                                    <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <div className="text-[11px] leading-relaxed">
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">Dica Prática</span>
                                      <span className="text-zinc-600 dark:text-zinc-300 font-medium">{step.tip}</span>
                                    </div>
                                  </div>
                                )}

                                {step.warning && (
                                  <div className="p-3.5 rounded-xl border border-rose-500/15 bg-rose-500/5 flex items-start space-x-2.5">
                                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                    <div className="text-[11px] leading-relaxed">
                                      <span className="font-bold text-rose-650 dark:text-rose-400 uppercase tracking-wider block mb-0.5">Atenção / Regra</span>
                                      <span className="text-zinc-650 dark:text-zinc-300 font-medium">{step.warning}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import {
  Package, Truck, UserCheck, Plane, Plus, X, Trash2, Edit3,
  Search, DollarSign, Tag, Phone, Mail, ExternalLink, TrendingUp,
  Hotel, Navigation, MapPin, Calendar, Clock, CheckCircle2, AlertCircle,
  Users, Building, Globe, Eye, BarChart3
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
interface InventarioTabProps { darkMode: boolean; inventoryItems: any[]; showToast: (m: string) => void; }

export function InventarioTab({ darkMode, inventoryItems, showToast }: InventarioTabProps) {
  const [search, setSearch] = useState('');
  const [filterCol, setFilterCol] = useState('todos');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [shake, setShake] = useState(false);

  const [form, setForm] = useState({ nome: '', descricao: '', quantidade: '', unidade: '', categoria: '', fornecedor: '', custo_unitario: '', _collection: 'inventario' });

  const filtered = inventoryItems.filter(i => {
    const matchSearch = (i.nome || '').toLowerCase().includes(search.toLowerCase());
    const matchCol = filterCol === 'todos' || i._collection === filterCol;
    return matchSearch && matchCol;
  });

  const collectionColors: Record<string, string> = {
    inventario: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    brindes: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    uniformes: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    estoque: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  const collectionLabels: Record<string, string> = {
    inventario: 'Inventário', brindes: 'Brindes', uniformes: 'Uniformes', estoque: 'Estoque'
  };

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

  return (
    <div className="w-full px-6 lg:px-12 xl:px-16 py-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
            <Package className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Gestão de Inventário</h2>
            <p className={`text-xs font-medium mt-0.5 ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{filtered.length} itens encontrados</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(true)} className={btnPrimary}>
          <Plus className="h-4 w-4" />
          <span>Novo Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-3 mb-6 p-4 rounded-2xl border ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar item..." className={`${inputCls(darkMode)} pl-9`} />
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Object.entries(collectionLabels).map(([key, label]) => {
          const count = inventoryItems.filter(i => i._collection === key).length;
          return (
            <div key={key} className={`p-4 rounded-xl border text-center ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <p className={`text-2xl font-black font-display ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{count}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Items Grid */}
      {filtered.length === 0 ? (
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
          {filtered.map(item => (
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
              <div className="flex items-center justify-between pt-3 border-t border-slate-200/40 dark:border-white/5">
                <div className="flex items-center space-x-1.5">
                  <Tag className="h-3.5 w-3.5 text-zinc-400" />
                  <span className={`text-xs font-bold ${darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>{item.quantidade ?? '-'} {item.unidade || 'un'}</span>
                </div>
                {item.custo_unitario > 0 && (
                  <span className="text-xs font-bold text-emerald-500">R$ {Number(item.custo_unitario).toFixed(2)}</span>
                )}
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

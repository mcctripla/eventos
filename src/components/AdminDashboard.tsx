import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { 
  Package, 
  Truck, 
  UserCheck, 
  Plane, 
  BarChart3, 
  ShieldCheck, 
  Activity,
  Users,
  Trash2,
  UserPlus,
  Calendar,
  Clock,
  Search,
  Edit3,
  X,
  CheckCircle2,
  DollarSign,
  BookOpen,
  TrendingUp,
  MapPin,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { InventarioTab, FornecedoresTab, ParticipantesTab, ViagensTab, EventosTab, FinanceiroTab, TutorialTab } from './TabViews';

export function AdminDashboard({ 
  darkMode,
  events = [],
  onEditEvent,
  onDeleteEvent,
  onAddEvent,
  onViewEvent
}: { 
  darkMode: boolean;
  events?: any[];
  onEditEvent?: (event: any) => void;
  onDeleteEvent?: (eventId: string) => void;
  onAddEvent?: () => void;
  onViewEvent?: (event: any) => void;
}) {
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Interactive chart states
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredDonut, setHoveredDonut] = useState<string | null>(null);
  const [animateCharts, setAnimateCharts] = useState(false);
  
  // Full data arrays for passing to child tabs
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [viagens, setViagens] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [baixasVendedores, setBaixasVendedores] = useState<any[]>([]);
  const [solicitacoesList, setSolicitacoesList] = useState<any[]>([]);

  // States for Users Tab Redesign
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // User form states
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormRole, setUserFormRole] = useState('pending');

  // Toast stub (admin dashboard is self-contained)
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    if (activeTab === 'Overview') {
      setAnimateCharts(false);
      const timer = setTimeout(() => setAnimateCharts(true), 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  useEffect(() => {
    // Merge from sub-collections with permission safety
    const logErr = (colName: string) => (err: any) => console.warn(`Admin sync bypassed for ${colName}:`, err);

    const unsubInv = onSnapshot(collection(db, 'inventario'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data(), _collection: 'inventario' }));
      setInventoryItems(prev => {
        const others = prev.filter(i => i._collection !== 'inventario');
        return [...others, ...items];
      });
    }, logErr('inventario'));

    const unsubBri = onSnapshot(collection(db, 'brindes'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data(), _collection: 'brindes' }));
      setInventoryItems(prev => {
        const others = prev.filter(i => i._collection !== 'brindes');
        return [...others, ...items];
      });
    }, logErr('brindes'));

    const unsubUni = onSnapshot(collection(db, 'uniformes'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data(), _collection: 'uniformes' }));
      setInventoryItems(prev => {
        const others = prev.filter(i => i._collection !== 'uniformes');
        return [...others, ...items];
      });
    }, logErr('uniformes'));

    const unsubEst = onSnapshot(collection(db, 'estoque'), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data(), _collection: 'estoque' }));
      setInventoryItems(prev => {
        const others = prev.filter(i => i._collection !== 'estoque');
        return [...others, ...items];
      });
    }, logErr('estoque'));

    const unsubForn = onSnapshot(collection(db, 'fornecedores'), (snap) => {
      setFornecedores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, logErr('fornecedores'));

    const unsubPart = onSnapshot(collection(db, 'participantes'), (snap) => {
      setParticipantes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, logErr('participantes'));

    const unsubViagens = onSnapshot(collection(db, 'viagens'), (snap) => {
      setViagens(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, logErr('viagens'));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, logErr('users'));

    const unsubBaixas = onSnapshot(collection(db, 'baixas_vendedores'), (snap) => {
      setBaixasVendedores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, logErr('baixas_vendedores'));

    const unsubSolicitacoes = onSnapshot(collection(db, 'solicitacoes_brindes'), (snap) => {
      setSolicitacoesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, logErr('solicitacoes_brindes'));

    return () => {
      unsubInv(); unsubBri(); unsubUni(); unsubEst();
      unsubForn(); unsubPart(); unsubViagens(); unsubUsers();
      unsubBaixas(); unsubSolicitacoes();
    };
  }, []);

  // Computed values for enhanced event-related dashboard
  const realEvents = useMemo(() => {
    return (events || []).filter((e: any) => !e.isHoliday);
  }, [events]);

  const eventStats = useMemo(() => {
    const totalEvents = realEvents.length;
    const planejado = realEvents.filter((e: any) => e.status === 'planejado').length;
    const confirmado = realEvents.filter((e: any) => e.status === 'confirmado').length;
    const concluido = realEvents.filter((e: any) => e.status === 'concluido').length;

    const totalBudget = realEvents.reduce((acc, e) => acc + (Number(e.orcamento_total) || 0), 0);
    const totalActualCost = realEvents.reduce((acc, e) => acc + (Number(e.custo_real) || 0), 0);
    const totalGiftsAllocated = realEvents.reduce((acc, e) => {
      const gifts = e.brindes_alocados || [];
      return acc + gifts.reduce((sum: number, g: any) => sum + (Number(g.qtd) || 0), 0);
    }, 0);

    return {
      totalEvents,
      planejado,
      confirmado,
      concluido,
      totalBudget,
      totalActualCost,
      totalGiftsAllocated
    };
  }, [realEvents]);

  const getEventDate = (evt: any): Date => {
    if (!evt.date) return new Date();
    if (typeof evt.date.toDate === 'function') return evt.date.toDate();
    if (evt.date instanceof Date) return evt.date;
    if (typeof evt.date === 'string') return new Date(evt.date);
    if (evt.date.seconds) return new Date(evt.date.seconds * 1000);
    return new Date();
  };

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...realEvents]
      .filter((e: any) => getEventDate(e) >= today)
      .sort((a, b) => getEventDate(a).getTime() - getEventDate(b).getTime())
      .slice(0, 5);
  }, [realEvents]);

  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    realEvents.forEach((e: any) => {
      const cat = e.category || 'Outros';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [realEvents]);

  const ufCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    realEvents.forEach((e: any) => {
      if (e.uf) {
        counts[e.uf] = (counts[e.uf] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([uf, count]) => ({ uf, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [realEvents]);

  const adminTabs = [
    { id: 'Overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'Financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'Eventos', label: 'Projetos/Eventos', icon: Calendar },
    { id: 'Inventário', label: 'Estoque', icon: Package },
    { id: 'Fornecedores', label: 'Fornecedores', icon: Truck },
    { id: 'Participantes', label: 'Participantes', icon: UserCheck },
    { id: 'Viagens', label: 'Logística de Viagens', icon: Plane },
    { id: 'Usuarios', label: 'Usuários', icon: Users },
    { id: 'Tutorial', label: 'Manual do Admin', icon: BookOpen }
  ];

  // Helper for updating user role
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      showToast('Permissão atualizada com sucesso!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar permissão.');
    }
  };

  // Helper for deleting user
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Deseja realmente remover o usuário com e-mail ${userEmail}?`)) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      showToast('Usuário removido com sucesso.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover usuário.');
    }
  };

  // Redesigned User Helpers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserFormName('');
    setUserFormEmail('');
    setUserFormRole('pending');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (usr: any) => {
    setEditingUser(usr);
    setUserFormName(usr.nome || '');
    setUserFormEmail(usr.email || '');
    setUserFormRole(usr.role || 'pending');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName.trim() || !userFormEmail.trim()) {
      showToast('Nome e E-mail são obrigatórios.');
      return;
    }

    try {
      const payload = {
        nome: userFormName.trim(),
        email: userFormEmail.trim().toLowerCase(),
        role: userFormRole
      };

      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), payload);
        showToast('Usuário atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'users'), payload);
        showToast('Usuário adicionado com sucesso!');
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      setUserFormName('');
      setUserFormEmail('');
      setUserFormRole('pending');
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao salvar usuário: ' + err.message);
    }
  };

  // SVG Chart Computations
  const stockCounts = {
    inventario: inventoryItems.filter(i => i._collection === 'inventario').reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0),
    brindes: inventoryItems.filter(i => i._collection === 'brindes').reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0),
    uniformes: inventoryItems.filter(i => i._collection === 'uniformes').reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0),
    estoque: inventoryItems.filter(i => i._collection === 'estoque').reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0),
  };
  const maxStock = Math.max(...Object.values(stockCounts), 10);

  const travelStatusCounts = {
    Pendente: viagens.filter(v => v.status === 'Pendente').length,
    Emitido: viagens.filter(v => v.status === 'Emitido').length,
    Cancelado: viagens.filter(v => v.status === 'Cancelado').length,
  };
  const totalTravels = viagens.length || 1;
  const travelAngles = {
    Pendente: (travelStatusCounts.Pendente / totalTravels) * 360,
    Emitido: (travelStatusCounts.Emitido / totalTravels) * 360,
    Cancelado: (travelStatusCounts.Cancelado / totalTravels) * 360,
  };

  return (
    <div className={`min-h-screen w-full font-sans pb-24 ${darkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold shadow-2xl animate-spring-in">
          {toastMsg}
        </div>
      )}

      {/* Admin Sub-Navigation */}
      <div className={`sticky top-20 z-40 border-b px-4 sm:px-6 lg:px-8 py-3 transition-colors ${
        darkMode ? 'bg-zinc-950/80 border-white/5 backdrop-blur-xl' : 'bg-white/80 border-slate-200/50 backdrop-blur-xl'
      }`}>
        <div className="w-full flex items-center justify-between px-2 sm:px-6 lg:px-12">
          
          {/* Mobile Dropdown View */}
          <div className="flex md:hidden items-center justify-between w-full gap-3">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Admin</span>
            </div>
            <div className="relative flex-1 max-w-xs">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className={`w-full p-2.5 pr-9 rounded-xl border text-xs font-bold transition-all appearance-none outline-none ${
                  darkMode
                    ? 'bg-zinc-900 border-white/10 text-white focus:border-indigo-500 shadow-lg'
                    : 'bg-white border-slate-200 text-zinc-900 focus:border-indigo-500 shadow-sm'
                }`}
              >
                {adminTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Desktop Tabs View */}
          <div className="hidden md:flex items-center space-x-2 w-full">
            <div className="flex items-center mr-4 pr-4 border-r border-slate-200 dark:border-white/10 space-x-2 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-[11px] font-bold tracking-widest uppercase">Admin Mode</span>
            </div>

            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                      : darkMode 
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900' 
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-6 lg:px-12 pt-6">
        
        {activeTab === 'Overview' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="mb-8">
              <h2 className="text-xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">Visão Geral da Operação</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Acompanhe o volume de registros globais e métricas consolidadas dos módulos operacionais.
              </p>
            </div>

            {/* Section 1: Eventos & Finanças KPIs */}
            <div className="mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-1.5 font-display">
                <Activity className="h-4 w-4 text-indigo-500" />
                Desempenho de Eventos & Indicadores Financeiros
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Event KPI 1: Total de Eventos */}
              <div className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden ${
                darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05]">
                  <Calendar className="h-32 w-32" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total de Eventos</h3>
                </div>
                <div className="relative z-10 flex items-baseline space-x-3">
                  <span className="text-4xl font-extrabold font-display text-zinc-900 dark:text-white">{eventStats.totalEvents}</span>
                  <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">Pla: {eventStats.planejado}</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">Conf: {eventStats.confirmado}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">Conc: {eventStats.concluido}</span>
                  </div>
                </div>
              </div>

              {/* Event KPI 2: Budget Aprovado Geral */}
              <div className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden ${
                darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05]">
                  <DollarSign className="h-32 w-32" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Budget Aprovado</h3>
                </div>
                <div className="relative z-10">
                  <span className="text-2xl font-extrabold font-display text-zinc-900 dark:text-white">
                    R$ {eventStats.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Event KPI 3: Custo Real Acumulado */}
              <div className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden ${
                darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05]">
                  <TrendingUp className="h-32 w-32" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Custo Real Acumulado</h3>
                </div>
                <div className="relative z-10 flex flex-col">
                  <span className="text-2xl font-extrabold font-display text-zinc-900 dark:text-white">
                    R$ {eventStats.totalActualCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {eventStats.totalBudget > 0 && (
                    <span className={`text-[10px] font-bold mt-1 ${
                      eventStats.totalActualCost > eventStats.totalBudget ? 'text-rose-500 animate-pulse' : 'text-zinc-400 dark:text-zinc-500'
                    }`}>
                      {((eventStats.totalActualCost / eventStats.totalBudget) * 100).toFixed(1)}% do budget utilizado
                    </span>
                  )}
                </div>
              </div>

              {/* Event KPI 4: Brindes & Uniformes Alocados */}
              <div className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden ${
                darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05]">
                  <Package className="h-32 w-32" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Itens Alocados</h3>
                </div>
                <div className="relative z-10">
                  <span className="text-4xl font-extrabold font-display text-zinc-900 dark:text-white">{eventStats.totalGiftsAllocated} u.</span>
                </div>
              </div>
            </div>

            {/* Separator line */}
            <hr className="border-slate-200/50 dark:border-white/5 my-6" />

            {/* Section 2: Operações Físicas KPIs */}
            <div className="mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-1.5 font-display">
                <Truck className="h-4 w-4 text-indigo-500" />
                Operações Físicas, Logística & Suprimentos
              </h3>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden ${
                darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05]">
                  <Package className="h-32 w-32" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total de Itens</h3>
                </div>
                <div className="relative z-10">
                  <span className="text-4xl font-extrabold font-display text-zinc-900 dark:text-white">{inventoryItems.length}</span>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden ${
                darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05]">
                  <Truck className="h-32 w-32" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Truck className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Fornecedores</h3>
                </div>
                <div className="relative z-10">
                  <span className="text-4xl font-extrabold font-display text-zinc-900 dark:text-white">{fornecedores.length}</span>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden ${
                darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05]">
                  <UserCheck className="h-32 w-32" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-3 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Base de Participantes</h3>
                </div>
                <div className="relative z-10">
                  <span className="text-4xl font-extrabold font-display text-zinc-900 dark:text-white">{participantes.length}</span>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden ${
                darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05]">
                  <Plane className="h-32 w-32" />
                </div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Plane className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Viagens Registradas</h3>
                </div>
                <div className="relative z-10">
                  <span className="text-4xl font-extrabold font-display text-zinc-900 dark:text-white">{viagens.length}</span>
                </div>
              </div>

            </div>

            {/* SVG Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              
              {/* Bar Chart SVG (Stock Levels) */}
              <div className={`p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-500" />
                  Volume de Itens em Estoque (Unidades)
                </h3>
                <div className="w-full flex items-center justify-center py-2 relative">
                  <svg viewBox="0 0 400 220" className="w-full max-h-56 overflow-visible">
                    {/* Y-axis helper lines */}
                    <line x1="50" y1="30" x2="380" y2="30" stroke={darkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9"} strokeWidth="1" />
                    <line x1="50" y1="80" x2="380" y2="80" stroke={darkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9"} strokeWidth="1" />
                    <line x1="50" y1="130" x2="380" y2="130" stroke={darkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9"} strokeWidth="1" />
                    <line x1="50" y1="180" x2="380" y2="180" stroke={darkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0"} strokeWidth="1.5" />

                    {/* Bars */}
                    {[
                      { label: 'Inventário', count: stockCounts.inventario, color: '#6366f1' },
                      { label: 'Brindes', count: stockCounts.brindes, color: '#8b5cf6' },
                      { label: 'Uniformes', count: stockCounts.uniformes, color: '#f59e0b' },
                      { label: 'Estoque', count: stockCounts.estoque, color: '#10b981' }
                    ].map((bar, i) => {
                      const barWidth = 45;
                      const spacing = 80;
                      const x = 70 + i * spacing;
                      const barHeight = (bar.count / maxStock) * 140 || 5; // Min height for visual feedback
                      const targetY = 180 - barHeight;
                      
                      const currentHeight = animateCharts ? barHeight : 0;
                      const currentY = animateCharts ? targetY : 180;

                      return (
                        <g 
                          key={i} 
                          className="group cursor-pointer"
                          onMouseEnter={() => setHoveredBar(i)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <rect 
                            x={x} 
                            y={currentY} 
                            width={barWidth} 
                            height={currentHeight} 
                            rx="6" 
                            fill={bar.color} 
                            opacity={hoveredBar === null || hoveredBar === i ? 1 : 0.35}
                            style={{
                              transition: 'height 0.8s cubic-bezier(0.16, 1, 0.3, 1), y 0.8s cubic-bezier(0.16, 1, 0.3, 1), fill 0.3s ease, opacity 0.3s ease, filter 0.3s ease',
                              filter: hoveredBar === i ? `drop-shadow(0 4px 12px ${bar.color}55)` : 'none'
                            }}
                          />
                          <text 
                            x={x + barWidth / 2} 
                            y={currentY - 8} 
                            textAnchor="middle" 
                            fontSize="10" 
                            fontWeight="bold" 
                            fill={darkMode ? '#fff' : '#0f172a'}
                            style={{
                              transition: 'y 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                              opacity: (hoveredBar === null || hoveredBar === i) && animateCharts ? 1 : 0
                            }}
                          >
                            {bar.count}
                          </text>
                          <text 
                            x={x + barWidth / 2} 
                            y="198" 
                            textAnchor="middle" 
                            fontSize="9" 
                            fontWeight="semibold" 
                            fill={darkMode ? '#a1a1aa' : '#64748b'}
                            style={{
                              transition: 'opacity 0.3s ease',
                              opacity: hoveredBar === null || hoveredBar === i ? 1 : 0.5
                            }}
                          >
                            {bar.label}
                          </text>
                        </g>
                      )
                    })}

                    {/* Tooltip Overlay */}
                    {hoveredBar !== null && (() => {
                      const hoveredItem = [
                        { label: 'Inventário', count: stockCounts.inventario, color: '#6366f1' },
                        { label: 'Brindes', count: stockCounts.brindes, color: '#8b5cf6' },
                        { label: 'Uniformes', count: stockCounts.uniformes, color: '#f59e0b' },
                        { label: 'Estoque', count: stockCounts.estoque, color: '#10b981' }
                      ][hoveredBar];
                      const tooltipBarHeight = (hoveredItem.count / maxStock) * 140 || 5;
                      const tooltipX = 70 + hoveredBar * 80 + 22.5;
                      const tooltipY = 180 - tooltipBarHeight - 15;

                      return (
                        <g className="pointer-events-none">
                          <rect
                            x={tooltipX - 55}
                            y={tooltipY - 35}
                            width={110}
                            height={36}
                            rx="8"
                            fill={darkMode ? '#18181b' : '#ffffff'}
                            stroke={hoveredItem.color}
                            strokeWidth="1.5"
                            style={{ filter: `drop-shadow(0 4px 12px ${hoveredItem.color}33)` }}
                          />
                          <text
                            x={tooltipX}
                            y={tooltipY - 23}
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="bold"
                            fill={darkMode ? '#a1a1aa' : '#64748b'}
                            className="uppercase tracking-wider"
                          >
                            {hoveredItem.label}
                          </text>
                          <text
                            x={tooltipX}
                            y={tooltipY - 9}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="extrabold"
                            fill={darkMode ? '#ffffff' : '#0f172a'}
                          >
                            {hoveredItem.count} unidades
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* Donut Chart SVG (Travel Status Distribution) */}
              <div className={`p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                  <Plane className="h-4 w-4 text-emerald-500" />
                  Status das Viagens Emitidas
                </h3>
                <div className="w-full flex flex-col sm:flex-row items-center justify-around py-4 gap-4">
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 overflow-visible">
                      {/* Grey background circle */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke={darkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9"} strokeWidth="3" />
                      
                      {/* Segments */}
                      {(() => {
                        let strokeOffset = 0;
                        return Object.entries(travelStatusCounts).map(([status, count], idx) => {
                          const percentage = (count / totalTravels) * 100;
                          const currentPercentage = animateCharts ? percentage : 0;
                          const color = status === 'Emitido' ? '#10b981' : status === 'Pendente' ? '#f59e0b' : '#ef4444';
                          const dashArray = `${currentPercentage} ${100 - currentPercentage}`;
                          const currentOffset = strokeOffset;
                          strokeOffset += percentage;

                          const isHovered = hoveredDonut === status;
                          const isAnyHovered = hoveredDonut !== null;

                          return (
                            <circle
                              key={idx}
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="none"
                              stroke={color}
                              strokeWidth={isHovered ? "4.2" : "3.2"}
                              strokeDasharray={dashArray}
                              strokeDashoffset={100 - currentOffset}
                              opacity={!isAnyHovered || isHovered ? 1 : 0.35}
                              onMouseEnter={() => setHoveredDonut(status)}
                              onMouseLeave={() => setHoveredDonut(null)}
                              style={{
                                transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.3s ease, opacity 0.3s ease, filter 0.3s ease',
                                filter: isHovered ? `drop-shadow(0 0 6px ${color}66)` : 'none',
                                cursor: 'pointer'
                              }}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                      <span className="text-2xl font-black transition-all duration-350 transform scale-100">
                        {hoveredDonut !== null 
                          ? travelStatusCounts[hoveredDonut as keyof typeof travelStatusCounts]
                          : viagens.length}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-extrabold transition-all duration-355">
                        {hoveredDonut !== null ? hoveredDonut : 'Total'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Legends */}
                  <div className="space-y-2.5">
                    {[
                      { status: 'Emitido', count: travelStatusCounts.Emitido, color: 'bg-emerald-500' },
                      { status: 'Pendente', count: travelStatusCounts.Pendente, color: 'bg-amber-500' },
                      { status: 'Cancelado', count: travelStatusCounts.Cancelado, color: 'bg-rose-500' }
                    ].map((item, idx) => {
                      const isItemHovered = hoveredDonut === item.status;
                      const isAnyDonutHovered = hoveredDonut !== null;
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center space-x-3 text-xs cursor-pointer transition-all duration-200 ${
                            isAnyDonutHovered && !isItemHovered ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100 font-semibold'
                          }`}
                          onMouseEnter={() => setHoveredDonut(item.status)}
                          onMouseLeave={() => setHoveredDonut(null)}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full ${item.color} ${isItemHovered ? 'ring-4 ring-offset-2 dark:ring-offset-zinc-950 ring-' + (item.status === 'Emitido' ? 'emerald' : item.status === 'Pendente' ? 'amber' : 'rose') + '-505/20' : ''}`} />
                          <span className="font-medium min-w-[70px]">{item.status}:</span>
                          <span className="font-bold">{item.count}</span>
                          <span className="text-[10px] text-zinc-400">
                            ({Math.round((item.count / totalTravels) * 100)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Seção de Análise de Eventos & Cronograma */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              
              {/* Coluna 1: Estatísticas de Temáticas & Localização */}
              <div className={`p-6 rounded-3xl border transition-all duration-300 ${
                darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2 font-display">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  Estatísticas de Temáticas & Localização
                </h3>

                {/* Sub-seção: Categorias Populares */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-display">
                    Principais Tópicos / Categorias
                  </h4>
                  {categoryCounts.length === 0 ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Nenhuma categoria registrada.</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryCounts.map((cat, idx) => {
                        const total = eventStats.totalEvents || 1;
                        const pct = Math.round((cat.count / total) * 100);
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{cat.label}</span>
                              <span className="text-zinc-500 dark:text-zinc-400">{cat.count} {cat.count === 1 ? 'evento' : 'eventos'} ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-indigo-600 dark:bg-indigo-50 transition-all duration-1000"
                                style={{ width: `${animateCharts ? pct : 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <hr className="border-slate-200/50 dark:border-white/5 my-4" />

                {/* Sub-seção: Abrangência por UF */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-display">
                    Estados com Mais Eventos (UF)
                  </h4>
                  {ufCounts.length === 0 ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Nenhum estado registrado.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {ufCounts.map((ufObj, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all ${
                            darkMode 
                              ? 'bg-zinc-900 border-white/5 hover:border-indigo-500/30 text-zinc-200' 
                              : 'bg-slate-50 border-slate-200 hover:border-indigo-500/30 text-slate-700'
                          }`}
                        >
                          <MapPin className="h-3 w-3 text-indigo-500" />
                          <span>{ufObj.uf}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-750" />
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{ufObj.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 2: Próximos Eventos do Calendário */}
              <div className={`p-6 rounded-3xl border transition-all duration-300 ${
                darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 font-display">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    Cronograma de Próximos Eventos
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold font-display">
                    Próximos 5
                  </span>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-8 w-8 text-zinc-400 dark:text-zinc-650 mb-3 animate-pulse" />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Nenhum evento futuro agendado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((evt, idx) => {
                      const dateObj = getEventDate(evt);
                      const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
                      const day = dateObj.getDate();
                      
                      const statusColors: Record<string, string> = {
                        'concluido': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                        'concluído': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                        'confirmado': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
                        'planejado': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                        'em negociação': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                      };
                      const statusCls = statusColors[evt.status?.toLowerCase()] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';

                      return (
                        <div 
                          key={idx}
                          onClick={() => onViewEvent && onViewEvent(evt)}
                          className={`p-3.5 rounded-2xl border flex items-start gap-4 transition-all duration-200 cursor-pointer ${
                            darkMode 
                              ? 'bg-zinc-950/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/40' 
                              : 'bg-slate-50/50 border-slate-200/60 hover:border-slate-300 hover:bg-slate-100/50'
                          }`}
                        >
                          {/* Calendar Box badge */}
                          <div className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-500 font-display shrink-0">
                            <span className="text-[9px] font-black tracking-wider leading-none">{month}</span>
                            <span className="text-base font-extrabold leading-none mt-1">{day}</span>
                          </div>

                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate leading-snug">
                                {evt.title || evt.evento || 'Evento sem título'}
                              </h4>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold border uppercase shrink-0 ${statusCls}`}>
                                {evt.status}
                              </span>
                            </div>
                            
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 truncate flex items-center gap-2">
                              {evt.category && (
                                <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                                  {evt.category}
                                </span>
                              )}
                              {evt.location && (
                                <span className="inline-flex items-center gap-0.5 text-zinc-400">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {evt.location}
                                </span>
                              )}
                              {evt.uf && ` (${evt.uf})`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Quick Action Info Box */}
            <div className={`mt-8 p-6 rounded-3xl border flex items-start gap-4 ${
              darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'
            }`}>
              <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Controle Operacional Central</h3>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-300 mt-1.5 leading-relaxed">
                  Use as abas no topo para gerenciar cada entidade separadamente. Os itens de inventário, parceiros comerciais, e participantes cadastrados nesta área servirão como banco de dados único e poderão ser referenciados ou alocados aos eventos que você criar na aba principal de Eventos.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Dynamic Inner Tab Rendering with proper data */}
        {activeTab === 'Financeiro' && (
          <div className="animate-fade-in-up">
            <FinanceiroTab 
              darkMode={darkMode}
              events={events}
              onEditEvent={onEditEvent}
              onViewEvent={onViewEvent}
              showToast={showToast}
            />
          </div>
        )}
        {activeTab === 'Eventos' && (
          <div className="animate-fade-in-up">
            <EventosTab 
              darkMode={darkMode} 
              events={events} 
              onEditEvent={onEditEvent} 
              onDeleteEvent={onDeleteEvent} 
              onAddEvent={onAddEvent} 
              showToast={showToast} 
            />
          </div>
        )}
        {activeTab === 'Inventário' && (
          <div className="animate-fade-in-up">
            <InventarioTab 
              darkMode={darkMode} 
              inventoryItems={inventoryItems} 
              events={events}
              baixasVendedores={baixasVendedores}
              solicitacoesList={solicitacoesList}
              showToast={showToast} 
            />
          </div>
        )}
        {activeTab === 'Fornecedores' && (
          <div className="animate-fade-in-up">
            <FornecedoresTab darkMode={darkMode} fornecedores={fornecedores} showToast={showToast} />
          </div>
        )}
        {activeTab === 'Participantes' && (
          <div className="animate-fade-in-up">
            <ParticipantesTab darkMode={darkMode} participantes={participantes} showToast={showToast} />
          </div>
        )}
        {activeTab === 'Viagens' && (
          <div className="animate-fade-in-up">
            <ViagensTab darkMode={darkMode} viagens={viagens} showToast={showToast} />
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'Usuarios' && (() => {
          const filteredUsers = usersList.filter(usr => {
            const query = userSearchQuery.toLowerCase().trim();
            if (!query) return true;
            return (usr.nome || '').toLowerCase().includes(query) || (usr.email || '').toLowerCase().includes(query);
          });

          const totalUsers = usersList.length;
          const adminCount = usersList.filter(u => u.role === 'admin').length;
          const approvedCount = usersList.filter(u => u.role === 'approved').length;
          const pendingCount = usersList.filter(u => u.role === 'pending' || !u.role).length;

          return (
            <div className="space-y-6 animate-fade-in-up pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-display tracking-tight text-zinc-905 dark:text-white font-sans flex items-center gap-2">
                    <Users className="h-5.5 w-5.5 text-indigo-500" />
                    Gestão de Usuários
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
                    CONTROLE DE ACESSOS, APROVAÇÃO E PERMISSÕES DO SISTEMA
                  </p>
                </div>
                <button
                  onClick={handleOpenAddUser}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Adicionar Usuário</span>
                </button>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total de Usuários */}
                <div className={`p-6 rounded-[24px] border flex items-center justify-between transition-all ${
                  darkMode ? 'bg-zinc-900/40 border-white/5 shadow-black/20' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-zinc-400">Total de Usuários</span>
                    <p className="text-3xl font-black font-display tracking-tight text-indigo-600 dark:text-indigo-400 leading-none pt-1">
                      {totalUsers}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-500'
                  }`}>
                    <Users className="h-5.5 w-5.5" />
                  </div>
                </div>

                {/* Administradores */}
                <div className={`p-6 rounded-[24px] border flex items-center justify-between transition-all ${
                  darkMode ? 'bg-zinc-900/40 border-white/5 shadow-black/20' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-zinc-400">Administradores</span>
                    <p className="text-3xl font-black font-display tracking-tight text-purple-650 dark:text-purple-400 leading-none pt-1">
                      {adminCount}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-500'
                  }`}>
                    <ShieldCheck className="h-5.5 w-5.5" />
                  </div>
                </div>

                {/* Aprovados */}
                <div className={`p-6 rounded-[24px] border flex items-center justify-between transition-all ${
                  darkMode ? 'bg-zinc-900/40 border-white/5 shadow-black/20' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-zinc-400">Aprovados</span>
                    <p className="text-3xl font-black font-display tracking-tight text-emerald-500 leading-none pt-1">
                      {approvedCount}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-505'
                  }`}>
                    <CheckCircle2 className="h-5.5 w-5.5" />
                  </div>
                </div>

                {/* Pendentes */}
                <div className={`p-6 rounded-[24px] border flex items-center justify-between transition-all ${
                  darkMode ? 'bg-zinc-900/40 border-white/5 shadow-black/20' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-zinc-400">Pendentes</span>
                    <p className="text-3xl font-black font-display tracking-tight text-amber-500 leading-none pt-1">
                      {pendingCount}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-505'
                  }`}>
                    <Clock className="h-5.5 w-5.5" />
                  </div>
                </div>

              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou e-mail..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border text-xs font-semibold outline-none transition-all focus:ring-2 focus:ring-indigo-500/10 ${
                    darkMode 
                      ? 'bg-zinc-900/30 border-white/5 text-white focus:border-indigo-500' 
                      : 'bg-white border-slate-200 text-zinc-800 focus:border-indigo-500 shadow-sm'
                  }`}
                />
              </div>

              {/* Users list table */}
              <div className={`border rounded-[32px] overflow-hidden ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-medium">
                    <thead>
                      <tr className={`border-b text-[10px] font-bold uppercase tracking-wider text-zinc-400 ${darkMode ? 'border-white/5 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'}`}>
                        <th className="py-4.5 px-6">Usuário</th>
                        <th className="py-4.5 px-6">E-mail</th>
                        <th className="py-4.5 px-6">Status</th>
                        <th className="py-4.5 px-6">Função</th>
                        <th className="py-4.5 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-xs text-zinc-400">
                            Nenhum registro de usuário localizado.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((usr) => {
                          const name = usr.nome || 'Sem Nome';
                          const initials = name
                            .split(' ')
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase() || 'U';

                          return (
                            <tr key={usr.id} className="hover:bg-slate-500/5 transition-colors">
                              {/* USUÁRIO */}
                              <td className="py-4 px-6 flex items-center space-x-3.5">
                                <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-605 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
                                  {initials}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-bold text-xs text-zinc-800 dark:text-zinc-150 truncate max-w-[150px]">{name}</div>
                                  <div className="text-[9px] text-zinc-400 font-mono mt-0.5" title={usr.id}>ID: {usr.id.slice(0, 8)}...</div>
                                </div>
                              </td>

                              {/* E-MAIL */}
                              <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]" title={usr.email}>
                                {usr.email || 'Sem Email'}
                              </td>

                              {/* STATUS */}
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                  usr.role === 'admin' 
                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/25' 
                                    : usr.role === 'approved' 
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' 
                                      : 'bg-amber-500/10 text-amber-505 border-amber-500/25'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                                    usr.role === 'admin' ? 'bg-rose-500' : usr.role === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`} />
                                  {usr.role === 'admin' ? 'Admin' : usr.role === 'approved' ? 'Aprovado' : 'Pendente'}
                                </span>
                              </td>

                              {/* FUNÇÃO SELECT */}
                              <td className="py-4 px-6">
                                <select 
                                  value={usr.role || 'pending'} 
                                  onChange={(e) => handleUpdateRole(usr.id, e.target.value)}
                                  className={`text-xs font-semibold rounded-xl px-2.5 py-1.5 border outline-none cursor-pointer transition-all bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 ${
                                    darkMode ? 'border-white/5 focus:border-indigo-500' : 'border-slate-200 focus:border-indigo-500 shadow-sm'
                                  }`}
                                >
                                  <option value="admin">Admin</option>
                                  <option value="approved">Approved</option>
                                  <option value="pending">Pending</option>
                                </select>
                              </td>

                              {/* AÇÕES */}
                              <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenEditUser(usr)}
                                  className="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-all inline-flex items-center justify-center cursor-pointer border border-transparent"
                                  title="Editar Usuário"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(usr.id, usr.email)}
                                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all inline-flex items-center justify-center cursor-pointer border border-transparent"
                                  title="Remover Usuário"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-400">
                      Nenhum registro de usuário localizado.
                    </div>
                  ) : (
                    filteredUsers.map((usr) => {
                      const name = usr.nome || 'Sem Nome';
                      const initials = name
                        .split(' ')
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'U';

                      return (
                        <div key={usr.id} className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-605 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
                                {initials}
                              </div>
                              <div className="overflow-hidden">
                                <div className="font-bold text-xs text-zinc-800 dark:text-zinc-150 truncate max-w-[150px]">{name}</div>
                                <div className="text-[9px] text-zinc-400 font-mono mt-0.5">ID: {usr.id.slice(0, 8)}...</div>
                              </div>
                            </div>
                            
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              usr.role === 'admin' 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/25' 
                                : usr.role === 'approved' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' 
                                  : 'bg-amber-500/10 text-amber-505 border-amber-500/25'
                            }`}>
                              {usr.role === 'admin' ? 'Admin' : usr.role === 'approved' ? 'Aprovado' : 'Pendente'}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-slate-100 dark:border-white/5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-zinc-400 font-medium">E-mail:</span>
                              <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate max-w-[200px]" title={usr.email}>{usr.email || 'Sem Email'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-400 font-medium">Função:</span>
                              <select 
                                value={usr.role || 'pending'} 
                                onChange={(e) => handleUpdateRole(usr.id, e.target.value)}
                                className={`text-[10px] font-semibold rounded-lg px-2 py-1 border outline-none cursor-pointer transition-all bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 ${
                                  darkMode ? 'border-white/5 focus:border-indigo-500' : 'border-slate-200 focus:border-indigo-500 shadow-sm'
                                }`}
                              >
                                <option value="admin">Admin</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                              <span className="text-zinc-405 font-medium">Ações:</span>
                              <div className="space-x-1.5 flex items-center">
                                <button
                                  onClick={() => handleOpenEditUser(usr)}
                                  className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-all inline-flex items-center justify-center cursor-pointer border border-transparent"
                                  title="Editar Usuário"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(usr.id, usr.email)}
                                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all inline-flex items-center justify-center cursor-pointer border border-transparent"
                                  title="Remover Usuário"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* User Add / Edit Modal Overlay */}
              {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)} />
                  <div className={`relative w-full max-w-md rounded-[32px] overflow-hidden border p-6 z-10 shadow-3xl ${
                    darkMode ? 'bg-zinc-950/90 border-white/10 text-white shadow-black/60' : 'bg-white border-slate-200 text-zinc-900 shadow-slate-350/50'
                  }`}
                  style={{ backdropFilter: 'blur(25px)' }}>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50 dark:border-white/5">
                      <h3 className="font-bold text-sm uppercase tracking-wider font-display">
                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                      </h3>
                      <button onClick={() => setIsUserModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer border border-transparent">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveUser} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Nome Completo</label>
                        <input
                          type="text"
                          required
                          placeholder="Digite o nome..."
                          value={userFormName}
                          onChange={e => setUserFormName(e.target.value)}
                          className={`w-full p-3.5 rounded-xl border text-xs outline-none focus:border-indigo-500 ${
                            darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-zinc-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Endereço de E-mail</label>
                        <input
                          type="email"
                          required
                          placeholder="ex: nome@tripla.com.br"
                          value={userFormEmail}
                          onChange={e => setUserFormEmail(e.target.value)}
                          className={`w-full p-3.5 rounded-xl border text-xs outline-none focus:border-indigo-500 ${
                            darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-zinc-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Perfil de Acesso (Role)</label>
                        <select
                          value={userFormRole}
                          onChange={e => setUserFormRole(e.target.value)}
                          className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none focus:border-indigo-500 ${
                            darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-zinc-900'
                          }`}
                        >
                          <option value="admin">Administrador (Admin)</option>
                          <option value="approved">Aprovado (Approved)</option>
                          <option value="pending">Pendente (Pending)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200/50 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => setIsUserModalOpen(false)}
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                            darkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md cursor-pointer"
                        >
                          {editingUser ? 'Salvar' : 'Adicionar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {activeTab === 'Tutorial' && (
          <div className="animate-fade-in-up">
            <TutorialTab darkMode={darkMode} />
          </div>
        )}

      </div>
    </div>
  );
}

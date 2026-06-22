import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { 
  Gift, 
  ShoppingBag, 
  User, 
  Users,
  Calendar, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Minus, 
  Moon, 
  Sun, 
  Search,
  ShoppingCart,
  ArrowLeft,
  PackageOpen
} from 'lucide-react';

interface GiftItem {
  id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  custo_unitario?: number;
  categoria?: string;
  fornecedor?: string;
}

interface CartItem {
  item: GiftItem;
  quantity: number;
}

export function PublicGiftRequestPage({
  darkMode,
  toggleDarkMode
}: {
  darkMode: boolean;
  toggleDarkMode: () => void;
}) {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Form state
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [cliente, setCliente] = useState('');
  const [motivo, setMotivo] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  
  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    // Fetch gifts (brindes)
    const unsubGifts = onSnapshot(collection(db, 'brindes'), (snap) => {
      const items = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GiftItem[];
      setGifts(items.sort((a, b) => a.nome.localeCompare(b.nome)));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching gifts:", err);
      setLoading(false);
    });

    // Fetch users for vendedor selection
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const items = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((u: any) => u.nome && u.role !== 'pending'); // Show approved/admin users
      setUsers(items.sort((a: any, b: any) => a.nome.localeCompare(b.nome)));
    }, (err) => {
      console.warn("Error fetching users for commercial form:", err);
    });

    return () => {
      unsubGifts();
      unsubUsers();
    };
  }, []);

  const filteredGifts = gifts.filter(gift => 
    gift.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gift.descricao || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (gift: GiftItem) => {
    if (gift.quantidade <= 0) {
      showToast('Este brinde está sem estoque no momento.');
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.item.id === gift.id);
      if (existing) {
        if (existing.quantity >= gift.quantidade) {
          showToast(`Quantidade limite atingida. Apenas ${gift.quantidade} unidades disponíveis.`);
          return prev;
        }
        return prev.map(i => i.item.id === gift.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      showToast(`"${gift.nome}" adicionado ao carrinho!`);
      return [...prev, { item: gift, quantity: 1 }];
    });
  };

  const updateCartQty = (giftId: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.item.id === giftId) {
          const newQty = i.quantity + delta;
          const maxQty = i.item.quantidade;
          if (newQty <= 0) return null;
          if (newQty > maxQty) {
            showToast(`Apenas ${maxQty} unidades disponíveis.`);
            return i;
          }
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (giftId: string) => {
    setCart(prev => prev.filter(i => i.item.id !== giftId));
    showToast('Item removido do carrinho.');
  };

  const handleClearForm = () => {
    setSelectedVendedor('');
    setCliente('');
    setMotivo('');
    setDataEntrega('');
    setCart([]);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};

    if (!selectedVendedor) newErrors.vendedor = true;
    if (!cliente.trim()) newErrors.cliente = true;
    if (!motivo.trim()) newErrors.motivo = true;
    if (!dataEntrega) newErrors.dataEntrega = true;
    if (cart.length === 0) {
      showToast('O carrinho está vazio! Adicione pelo menos um brinde.');
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Verify stock availability once more before submitting
    for (const cartItem of cart) {
      const liveGift = gifts.find(g => g.id === cartItem.item.id);
      if (!liveGift) {
        showToast(`Item "${cartItem.item.nome}" não está mais disponível.`);
        return;
      }
      if (liveGift.quantidade < cartItem.quantity) {
        showToast(`Estoque insuficiente para "${cartItem.item.nome}". Disponível: ${liveGift.quantidade}.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const requestPayload = {
        vendedor: selectedVendedor,
        cliente: cliente.trim(),
        motivo: motivo.trim(),
        data_entrega: dataEntrega,
        status: 'pendente',
        itens: cart.map(c => ({
          itemId: c.item.id,
          itemName: c.item.nome,
          quantidade: c.quantity,
          custo_unitario: c.item.custo_unitario || 0
        })),
        timestamp: Timestamp.now()
      };

      await addDoc(collection(db, 'solicitacoes_brindes'), requestPayload);
      
      setSubmitSuccess(true);
      handleClearForm();
    } catch (error: any) {
      console.error("Error submitting gift request:", error);
      showToast("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans w-full transition-colors duration-300 relative overflow-hidden pb-16 ${
      darkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Floating ambient orbs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 dark:opacity-60">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent blur-[120px]" />
        <div className="absolute top-[30%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-fuchsia-500/8 via-violet-500/8 to-transparent blur-[110px]" />
      </div>

      {/* Toast message */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold shadow-2xl animate-spring-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-all ${
        darkMode ? 'bg-zinc-950/80 border-white/5' : 'bg-white/80 border-slate-200/60'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight font-display">Solicitação de Brindes</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                Canal Comercial
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                darkMode 
                  ? 'bg-zinc-900 border-white/5 text-zinc-300 hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
              }`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <a 
              href="/"
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                darkMode
                  ? 'bg-zinc-900 border-white/5 text-zinc-300 hover:text-white hover:bg-zinc-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Sistema</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 relative z-10">
        
        {submitSuccess ? (
          <div className="max-w-md mx-auto text-center py-16 animate-fade-in-up">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/20">
              <CheckCircle2 className="h-16 w-16" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Solicitação Enviada!</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
              Sua solicitação comercial de brindes foi registrada. Ela aguarda aprovação pelo administrador e, após confirmada, o estoque será baixado e reservado.
            </p>
            <button
              onClick={() => setSubmitSuccess(false)}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md hover:shadow-indigo-500/20 animate-spring-in"
            >
              Nova Solicitação
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Catalog Column */}
            <div className="lg:col-span-7 space-y-6 animate-fade-in-up">
              <div className={`p-6 rounded-3xl border ${
                darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-sm font-extrabold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 font-display">
                      Catálogo de Brindes em Estoque
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      Adicione itens ao carrinho e especifique as quantidades necessárias.
                    </p>
                  </div>
                  
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-505" />
                    <input 
                      type="text"
                      placeholder="Buscar brindes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full sm:w-56 pl-10 pr-4 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        darkMode 
                          ? 'bg-zinc-950 border-white/5 text-white placeholder-zinc-500 focus:border-indigo-500/50' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : filteredGifts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
                    <PackageOpen className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mb-3" />
                    <p className="text-xs text-zinc-500">Nenhum brinde disponível no momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredGifts.map((gift) => {
                      const inCart = cart.find(i => i.item.id === gift.id);
                      const availableStock = gift.quantidade - (inCart?.quantity || 0);

                      return (
                        <div 
                          key={gift.id}
                          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-md ${
                            darkMode 
                              ? 'bg-zinc-950/40 border-white/5 hover:border-indigo-500/20' 
                              : 'bg-slate-50/50 border-slate-200 hover:border-indigo-500/20'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                {gift.nome}
                              </h3>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                                gift.quantidade === 0 
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                  : gift.quantidade <= 10 
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              }`}>
                                {gift.quantidade === 0 
                                  ? 'Esgotado' 
                                  : `${gift.quantidade} dispo.`}
                              </span>
                            </div>

                            {gift.descricao && (
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed mb-4">
                                {gift.descricao}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                            <span className="text-[10px] text-zinc-500">
                              {gift.categoria || 'Brinde'}
                            </span>
                            <button
                              onClick={() => addToCart(gift)}
                              disabled={availableStock <= 0}
                              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                                availableStock <= 0
                                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-650 cursor-not-allowed'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                              }`}
                            >
                              <Plus className="h-3 w-3" />
                              <span>Adicionar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Form and Cart Column */}
            <div className="lg:col-span-5 space-y-6 animate-fade-in-up">
              
              {/* Shopping Cart Section */}
              <div className={`p-6 rounded-3xl border ${
                darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505 mb-4 flex items-center gap-2 font-display">
                  <ShoppingCart className="h-4 w-4 text-indigo-500" />
                  Carrinho de Solicitações
                </h3>

                {cart.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                    <p className="text-xs">O carrinho está vazio.</p>
                    <p className="text-[10px] mt-1">Selecione brindes no catálogo para adicionar.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {cart.map((cartItem) => (
                      <div 
                        key={cartItem.item.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          darkMode ? 'bg-zinc-950/40 border-white/5' : 'bg-slate-50/60 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                            {cartItem.item.nome}
                          </h4>
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-550">
                            Estoque disponível: {cartItem.item.quantidade}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex items-center border border-slate-200 dark:border-white/5 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                            <button
                              type="button"
                              onClick={() => updateCartQty(cartItem.item.id, -1)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-2 text-xs font-extrabold w-8 text-center select-none">
                              {cartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(cartItem.item.id, 1)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(cartItem.item.id)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Section */}
              <div className={`p-6 rounded-3xl border ${
                darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-6 flex items-center gap-2 font-display">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Dados da Solicitação
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Vendedor (Dropdown) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 flex items-center gap-1.5 font-display">
                      <User className="h-3.5 w-3.5 text-indigo-500" />
                      Vendedor Solicitante *
                    </label>
                    <select
                      value={selectedVendedor}
                      onChange={(e) => {
                        setSelectedVendedor(e.target.value);
                        if (errors.vendedor) setErrors(prev => ({ ...prev, vendedor: false }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        errors.vendedor 
                          ? 'border-rose-500 bg-rose-500/5 focus:ring-rose-500' 
                          : darkMode 
                            ? 'bg-zinc-950 border-white/5 text-white' 
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="">Selecione seu nome</option>
                      {users.map(u => (
                        <option key={u.id} value={u.nome}>{u.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cliente / Empresa */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 flex items-center gap-1.5 font-display">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      Cliente / Empresa Destinatária *
                    </label>
                    <input 
                      type="text"
                      placeholder="Nome do cliente ou empresa"
                      value={cliente}
                      onChange={(e) => {
                        setCliente(e.target.value);
                        if (errors.cliente) setErrors(prev => ({ ...prev, cliente: false }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        errors.cliente 
                          ? 'border-rose-500 bg-rose-500/5 focus:ring-rose-500' 
                          : darkMode 
                            ? 'bg-zinc-950 border-white/5 text-white placeholder-zinc-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  {/* Data Entrega */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 flex items-center gap-1.5 font-display">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      Data Desejada para Entrega *
                    </label>
                    <input 
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={dataEntrega}
                      onChange={(e) => {
                        setDataEntrega(e.target.value);
                        if (errors.dataEntrega) setErrors(prev => ({ ...prev, dataEntrega: false }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        errors.dataEntrega 
                          ? 'border-rose-500 bg-rose-500/5 focus:ring-rose-500' 
                          : darkMode 
                            ? 'bg-zinc-950 border-white/5 text-white' 
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>


                  {/* Motivo */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 flex items-center gap-1.5 font-display">
                      <FileText className="h-3.5 w-3.5 text-indigo-500" />
                      Motivo / Justificativa *
                    </label>
                    <textarea 
                      placeholder="Detalhes da ação comercial, brinde de relacionamento, etc."
                      rows={3}
                      value={motivo}
                      onChange={(e) => {
                        setMotivo(e.target.value);
                        if (errors.motivo) setErrors(prev => ({ ...prev, motivo: false }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none ${
                        errors.motivo 
                          ? 'border-rose-500 bg-rose-500/5 focus:ring-rose-500' 
                          : darkMode 
                            ? 'bg-zinc-950 border-white/5 text-white placeholder-zinc-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || cart.length === 0}
                    className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                      cart.length === 0
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-450 dark:text-zinc-650 cursor-not-allowed shadow-none'
                        : isSubmitting
                          ? 'bg-indigo-600/70 text-white cursor-wait'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/20'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Enviando solicitação...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" />
                        <span>Enviar Solicitação</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}

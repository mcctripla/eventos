import React, { useState, useMemo, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Auth } from './components/Auth';
import logoWhite from './logo_white.png';
import logoColor from './logo_color.png';
import { AdminDashboard } from './components/AdminDashboard';
import * as xlsx from 'xlsx';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  List, 
  Layers, 
  X, 
  Sparkles, 
  Share2, 
  Heart, 
  Info, 
  Moon, 
  Sun,
  Compass,
  Briefcase,
  Cpu,
  HeartPulse,
  Users,
  Bookmark,
  ArrowUpRight,
  Flag,
  Building,
  CheckCircle2,
  AlertCircle,
  History,
  Monitor,
  Globe,
  Pencil,
  Bell,
  LogOut,
  Package,
  Truck,
  UserCheck,
  Plane,
  Trash2,
  Edit3,
  DollarSign,
  Tag,
  Phone,
  Mail,
  ExternalLink,
  TrendingUp,
  Hotel,
  Navigation,
  ShieldCheck
} from 'lucide-react';

const typographyStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  
  body, .font-sans {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  
  .font-display {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    letter-spacing: -0.02em;
  }
  
  /* Floating Background Orbs Keyframes */
  @keyframes float-orb-slow {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(40px, -60px) scale(1.12); }
    66% { transform: translate(-30px, 30px) scale(0.95); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  
  @keyframes float-orb-reverse {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(-50px, 50px) scale(0.9); }
    66% { transform: translate(40px, -40px) scale(1.08); }
    100% { transform: translate(0px, 0px) scale(1); }
  }

  /* Spring elastic modal animation */
  @keyframes spring-in {
    0% { transform: scale(0.94); opacity: 0; }
    60% { transform: scale(1.015); }
    85% { transform: scale(0.995); }
    100% { transform: scale(1); opacity: 1; }
  }

  .animate-spring-in {
    animation: spring-in 0.45s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  .animate-float-1 {
    animation: float-orb-slow 22s infinite ease-in-out;
  }

  .animate-float-2 {
    animation: float-orb-reverse 28s infinite ease-in-out;
  }

  .animate-float-3 {
    animation: float-orb-slow 24s infinite ease-in-out 3s;
  }

  /* Custom subtle scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.12);
    border-radius: 100px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.25);
  }
`;

const PREMIUM_AVATARS = [
  { name: 'Ana Silva', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80' },
  { name: 'Lucas Reis', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80' },
  { name: 'Camila Nery', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80' },
  { name: 'Pedro Souza', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80' },
  { name: 'Mariana Luz', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&h=100&q=80' },
  { name: 'Roberto Lima', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100&q=80' }
];

const INITIAL_EVENTS = [
  // Eventos Corporativos
  {
    id: 'corp-1',
    title: 'Planejamento Estratégico Q3 & OKRs',
    description: 'Reunião geral com lideranças e diretores para consolidar as metas corporativas do próximo trimestre. Alinhamento de objetivos globais, roadmaps de tecnologia e forecasts de receita.',
    date: new Date(2026, 4, 15, 9, 0), 
    endDate: new Date(2026, 4, 15, 12, 0),
    location: 'Sede SP & Sala Virtual Zoom 01',
    category: 'Evento Interno',
    format: 'Híbrido',
    status: 'concluído',
    host: 'Renato M. Albuquerque (CEO)',
    gradient: 'from-slate-900 to-indigo-950',
    icon: Briefcase,
    color: 'indigo',
    members: [PREMIUM_AVATARS[0], PREMIUM_AVATARS[1], PREMIUM_AVATARS[2], PREMIUM_AVATARS[5]],
    isHoliday: false,
    scope: ''
  },
  {
    id: 'corp-2',
    title: 'Design Synergy Summit 2026',
    description: 'Encontro de designers de produto e frontend do ecossistema. Discussão de novos padrões de Design Systems, micro-interações elegantes e arquitetura de componentes de alta fidelidade visual.',
    date: new Date(2026, 4, 18, 14, 0), 
    endDate: new Date(2026, 4, 18, 18, 0),
    location: 'Inovabra Habitat, São Paulo',
    category: 'Comercial Interno',
    format: 'Presencial',
    status: 'concluído',
    host: 'Ana Carolina Silva (UX Lead)',
    gradient: 'from-violet-600 via-indigo-600 to-cyan-500',
    icon: Sparkles,
    color: 'violet',
    members: [PREMIUM_AVATARS[0], PREMIUM_AVATARS[1], PREMIUM_AVATARS[2], PREMIUM_AVATARS[3], PREMIUM_AVATARS[4]],
    isHoliday: false,
    scope: ''
  },
  {
    id: 'corp-3',
    title: 'Next-Gen AI & Web Technologies',
    description: 'Workshops e demonstrações práticas da nossa infraestrutura de IA rodando diretamente no browser utilizando WebGPU e modelos otimizados localmente.',
    date: new Date(2026, 4, 22, 10, 0), 
    endDate: new Date(2026, 4, 22, 13, 0),
    location: 'Escritório Belo Horizonte & Meet (Híbrido)',
    category: 'Comercial Patrocinado',
    format: 'Híbrido',
    status: 'confirmado',
    host: 'Dr. Lucas Mendonça (AI Research)',
    gradient: 'from-sky-500 via-blue-600 to-indigo-600',
    icon: Cpu,
    color: 'sky',
    members: [PREMIUM_AVATARS[2], PREMIUM_AVATARS[3], PREMIUM_AVATARS[5]],
    isHoliday: false,
    scope: 'Belo Horizonte'
  },
  {
    id: 'corp-4',
    title: 'Programa Wellness & Saúde Mental Coletiva',
    description: 'Palestra com especialistas sobre higiene do sono profunda, biohacking corporativo sustentável e dinâmicas de equilíbrio entre vida profissional e pessoal.',
    date: new Date(2026, 4, 25, 8, 30), 
    endDate: new Date(2026, 4, 25, 10, 0),
    location: 'Transmissão Geral (Portal RH)',
    category: 'Evento Interno',
    format: 'Online',
    status: 'planejado',
    host: 'Dra. Camila Nogueira (Corporate Health)',
    gradient: 'from-emerald-500 to-teal-600',
    icon: HeartPulse,
    color: 'emerald',
    members: [PREMIUM_AVATARS[0], PREMIUM_AVATARS[2], PREMIUM_AVATARS[4], PREMIUM_AVATARS[1], PREMIUM_AVATARS[3]],
    isHoliday: false,
    scope: ''
  },

  // Feriados Nacionais 2026
  {
    id: 'h-1',
    title: 'Confraternização Universal (Ano Novo)',
    description: 'Início do ano civil. Feriado Nacional. Sem expediente em todas as nossas sedes físicas e virtuais.',
    date: new Date(2026, 0, 1),
    endDate: new Date(2026, 0, 1, 23, 59),
    location: 'Nacional (Todo o Brasil)',
    category: 'Feriado',
    format: 'Presencial',
    status: 'confirmado',
    host: 'Legislação Federal',
    gradient: 'from-slate-700 via-slate-800 to-zinc-900',
    icon: Flag,
    color: 'slate',
    members: [],
    isHoliday: true,
    scope: 'Nacional'
  },
  {
    id: 'h-2',
    title: 'Carnaval (Recesso de Equipes)',
    description: 'Ponto facultativo nacional. Folga concedida aos times para reenergização.',
    date: new Date(2026, 1, 16),
    endDate: new Date(2026, 1, 17, 23, 59),
    location: 'Nacional (Todo o Brasil)',
    category: 'Feriado',
    format: 'Presencial',
    status: 'confirmado',
    host: 'Legislação Federal',
    gradient: 'from-slate-700 via-slate-800 to-zinc-900',
    icon: Flag,
    color: 'slate',
    members: [],
    isHoliday: true,
    scope: 'Nacional'
  },
  {
    id: 'h-3',
    title: 'Paixão de Cristo (Sexta-feira Santa)',
    description: 'Feriado religioso nacional consagrado. Atividades operacionais suspensas.',
    date: new Date(2026, 3, 3), 
    endDate: new Date(2026, 3, 3, 23, 59),
    location: 'Nacional (Todo o Brasil)',
    category: 'Feriado',
    format: 'Presencial',
    status: 'confirmado',
    host: 'Legislação Federal',
    gradient: 'from-slate-700 via-slate-800 to-zinc-900',
    icon: Flag,
    color: 'slate',
    members: [],
    isHoliday: true,
    scope: 'Nacional'
  },
  {
    id: 'h-4',
    title: 'Dia de Tiradentes',
    description: 'Feriado nacional brasileiro. Recordação de Joaquim José da Silva Xavier.',
    date: new Date(2026, 3, 21),
    endDate: new Date(2026, 3, 21, 23, 59),
    location: 'Nacional (Todo o Brasil)',
    category: 'Feriado',
    format: 'Presencial',
    status: 'confirmado',
    host: 'Legislação Federal',
    gradient: 'from-slate-700 via-slate-800 to-zinc-900',
    icon: Flag,
    color: 'slate',
    members: [],
    isHoliday: true,
    scope: 'Nacional'
  },
  {
    id: 'h-5',
    title: 'Dia do Trabalho',
    description: 'Feriado nacional. Comemoração e homenagem às conquistas de nossa força de trabalho corporativa.',
    date: new Date(2026, 4, 1),
    endDate: new Date(2026, 4, 1, 23, 59),
    location: 'Nacional (Todo o Brasil)',
    category: 'Feriado',
    format: 'Presencial',
    status: 'confirmado',
    host: 'Legislação Federal',
    gradient: 'from-slate-700 via-slate-800 to-zinc-900',
    icon: Flag,
    color: 'slate',
    members: [],
    isHoliday: true,
    scope: 'Nacional'
  },
  {
    id: 'h-6',
    title: 'Corpus Christi (Ponto Facultativo)',
    description: 'Ponto facultativo tradicional. Calendário de plantões sob demanda no setor de suporte.',
    date: new Date(2026, 5, 4),
    endDate: new Date(2026, 5, 4, 23, 59),
    location: 'Nacional (Todo o Brasil)',
    category: 'Feriado',
    format: 'Presencial',
    status: 'confirmado',
    host: 'Legislação Federal',
    gradient: 'from-slate-700 via-slate-800 to-zinc-900',
    icon: Flag,
    color: 'slate',
    members: [],
    isHoliday: true,
    scope: 'Nacional'
  },

  // Feriados São Paulo
  {
    id: 'h-sp-1',
    title: 'Aniversário de São Paulo',
    description: 'Feriado municipal paulistano. Sem expediente no escritório físico de SP. Colaboradores locais dispensados.',
    date: new Date(2026, 0, 25),
    endDate: new Date(2026, 0, 25, 23, 59),
    location: 'São Paulo - SP',
    category: 'Feriado',
    format: 'Presencial',
    status: 'confirmado',
    host: 'Prefeitura de São Paulo',
    gradient: 'from-neutral-800 to-neutral-950',
    icon: MapPin,
    color: 'slate',
    members: [],
    isHoliday: true,
    scope: 'São Paulo'
  },

  // Feriados Belo Horizonte
  {
    id: 'h-bh-1',
    title: 'Assunção de Nossa Senhora',
    description: 'Feriado municipal em Belo Horizonte. Sem expediente no escritório físico de BH.',
    date: new Date(2026, 7, 15),
    endDate: new Date(2026, 7, 15, 23, 59),
    location: 'Belo Horizonte - MG',
    category: 'Feriado',
    format: 'Presencial',
    status: 'confirmado',
    host: 'Prefeitura de BH',
    gradient: 'from-neutral-800 to-neutral-950',
    icon: MapPin,
    color: 'slate',
    members: [],
    isHoliday: true,
    scope: 'Belo Horizonte'
  }
];

const CATEGORIES = ['Todos', 'Comercial Interno', 'Comercial Patrocinado', 'Evento Interno', 'Feriado'];
const FORMATS = ['Todos', 'Online', 'Presencial', 'Híbrido'];

const CATEGORY_STYLES = {
  'Comercial Interno': {
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-305 border-indigo-200/50 dark:border-indigo-800/40',
    dot: 'bg-indigo-500'
  },
  'Comercial Patrocinado': {
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-305 border-violet-200/50 dark:border-violet-800/40',
    dot: 'bg-violet-500'
  },
  'Evento Interno': {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40',
    dot: 'bg-emerald-500'
  },
  'Feriado': {
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40',
    dot: 'bg-amber-500'
  }
};

const FORMAT_STYLES = {
  'Online': {
    badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200/30 dark:border-cyan-800/40',
    icon: Monitor
  },
  'Presencial': {
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/30 dark:border-rose-800/40',
    icon: MapPin
  },
  'Híbrido': {
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/30 dark:border-purple-800/40',
    icon: Globe
  }
};

const STATUS_STYLES = {
  'em negociação': {
    label: 'Em Negociação',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/40 dark:border-amber-900/30',
    dot: 'bg-amber-500'
  },
  'planejado': {
    label: 'Planejado',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/40 dark:border-blue-900/30',
    dot: 'bg-blue-500'
  },
  'confirmado': {
    label: 'Confirmado',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-900/30',
    dot: 'bg-emerald-500'
  },
  'concluído': {
    label: 'Concluído',
    badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400 border-zinc-200/40 dark:border-zinc-700/30',
    dot: 'bg-zinc-500'
  }
};

interface DayObject {
  date: Date;
  isCurrentMonth: boolean;
}

const getDaysInMonth = (date: Date): DayObject[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days: DayObject[] = [];
  const startPadding = firstDay.getDay();
  
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month, -i),
      isCurrentMonth: false
    });
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  const endPadding = 6 - lastDay.getDay();
  for (let i = 1; i <= endPadding; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }
  
  return days;
};

const getDaysInWeek = (date: Date): Date[] => {
  const currentDayOfWeek = date.getDay();
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - currentDayOfWeek);
  
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatDateLong = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

interface AvatarMember {
  name: string;
  avatar: string;
}

interface AvatarStackProps {
  members?: any[];
  max?: number;
  isHoliday?: boolean;
  scope?: string;
}

function AvatarStack({ members = [], max = 4, isHoliday = false, scope = '' }: AvatarStackProps) {
  if (isHoliday) {
    return (
      <div className="flex items-center space-x-1.5 py-0.5 px-2 bg-slate-100 dark:bg-zinc-850 rounded-lg text-[9px] font-bold text-zinc-500 dark:text-zinc-400 border border-slate-200/50 dark:border-white/5">
        <Building className="h-3 w-3 text-zinc-400" />
        <span className="uppercase tracking-wider">{scope ? `Sede ${scope}` : 'Feriado'}</span>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">Sem equipe alocada</span>
    );
  }
  
  const bgColors = [
    'bg-indigo-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
    'bg-purple-500 text-white',
    'bg-sky-500 text-white',
  ];

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden">
      {members.slice(0, max).map((m, idx) => {
        const name = m.name || m.member || m.nome || 'P';
        const role = m.role || m.funcao || m.cargo || '';
        const initial = name.charAt(0).toUpperCase();
        const bgColor = bgColors[idx % bgColors.length];
        const isUrl = m.avatar && m.avatar.startsWith('http');

        return (
          <div key={idx} className="relative group/avatar shrink-0">
            {isUrl ? (
              <img 
                src={m.avatar} 
                alt={name} 
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border-[1.5px] border-white dark:border-zinc-900 shadow-md group-hover/avatar:scale-115 group-hover/avatar:-translate-y-0.5 transition-all duration-200 cursor-pointer z-10"
              />
            ) : (
              <div 
                className={`w-7 h-7 rounded-full border-[1.5px] border-white dark:border-zinc-900 shadow-md flex items-center justify-center text-[10px] font-bold font-display ${bgColor} group-hover/avatar:scale-115 group-hover/avatar:-translate-y-0.5 transition-all duration-200 cursor-pointer z-10`}
              >
                {initial}
              </div>
            )}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[9px] font-semibold text-white bg-zinc-900 rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-155 pointer-events-none whitespace-nowrap shadow-xl z-20">
              {name} {role ? `(${role})` : ''}
            </span>
          </div>
        );
      })}
      {members.length > max && (
        <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border-[1.5px] border-white dark:border-zinc-900 flex items-center justify-center text-[9px] font-bold text-zinc-500 dark:text-zinc-400 shadow-md z-10">
          +{members.length - max}
        </div>
      )}
    </div>
  );
}

class AdminErrorBoundary extends React.Component<{ children: React.ReactNode, darkMode: boolean }, { hasError: boolean, error: any }> {
  state: { hasError: boolean; error: any };
  props: { children: React.ReactNode; darkMode: boolean };

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className={`p-8 min-h-screen ${this.props.darkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-zinc-900'}`}>
          <h2 className="text-xl font-bold text-red-500 font-display">Erro de Renderização no Painel Admin</h2>
          <p className="text-xs text-zinc-400 mt-2">Um erro inesperado aconteceu ao desenhar o Painel Administrativo. Detalhes técnicos:</p>
          <pre className="mt-4 p-4 rounded bg-red-500/10 border border-red-500/20 text-xs font-mono overflow-auto max-w-full">
            {this.state.error?.toString()}
          </pre>
          <pre className="mt-4 p-4 rounded bg-zinc-900 text-zinc-400 text-xs font-mono overflow-auto max-w-full max-h-96">
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const [userRole, setUserRole] = useState<string>('pending');

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        unsubUserDoc = onSnapshot(userDocRef, async (snap) => {
          console.log("Current user doc snapshot in App.tsx:", snap.id, "exists:", snap.exists(), "data:", snap.data());
          
          let currentRole = 'pending';
          let needsMigrationCheck = true;

          if (snap.exists()) {
            currentRole = snap.data().role || 'pending';
            
            // Promover desenvolvedores rodando localmente para Admin
            if (currentRole === 'pending' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
              try {
                await updateDoc(userDocRef, { role: 'admin' });
                currentRole = 'admin';
                console.info("Desenvolvedor local promovido automaticamente a admin no Firestore.");
              } catch (e) {
                console.warn("Falha ao salvar permissao admin no Firestore (restricao de regras), contornando localmente no client:", e);
                currentRole = 'admin';
              }
            }

            setUserRole(currentRole);
            setAuthLoading(false);

            if (currentRole === 'admin' || currentRole === 'approved') {
              needsMigrationCheck = false;
            }
          }

          if (needsMigrationCheck) {
            const email = currentUser.email || '';
            try {
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
              const querySnapshot = await getDocs(q);

              // Look for a pre-created document with a better role (admin or approved)
              let foundBetterProfile = null;
              for (const docSnap of querySnapshot.docs) {
                if (docSnap.id !== currentUser.uid) {
                  const data = docSnap.data();
                  if (data.role === 'admin' || data.role === 'approved') {
                    foundBetterProfile = docSnap;
                    break;
                  }
                }
              }

              if (foundBetterProfile) {
                const existingData = foundBetterProfile.data();
                // Overwrite the pending document with the pre-created role
                await setDoc(userDocRef, {
                  nome: existingData.nome || email.split('@')[0],
                  email: email.toLowerCase().trim(),
                  role: existingData.role,
                  createdAt: existingData.createdAt || new Date().toISOString()
                });

                // Clean up the temporary document
                try {
                  await deleteDoc(doc(db, 'users', foundBetterProfile.id));
                } catch (delErr) {
                  console.warn("Failed to delete temp pre-created document in App:", delErr);
                }
              } else if (!snap.exists()) {
                // If the document doesn't exist and we didn't find any pre-created profile, create new pending one
                const defaultName = currentUser.displayName || email.split('@')[0] || 'Novo Usuário';
                const roleToSet = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'admin' : 'pending';
                await setDoc(userDocRef, {
                  nome: defaultName,
                  email: email.toLowerCase().trim(),
                  role: roleToSet,
                  createdAt: new Date().toISOString()
                });
                setUserRole(roleToSet);
              }
            } catch (err) {
              console.error("Error migrating or creating user document", err);
              if (!snap.exists()) {
                setUserRole('pending');
              }
            }
            setAuthLoading(false);
          }
        }, (err) => {
          console.error("Error listening to user document", err);
          setUserRole('pending');
          setAuthLoading(false);
        });
      } else {
        setUserRole('pending');
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    setDbError(null);
    const eventsRef = collection(db, 'eventos');
    const unsubscribe = onSnapshot(eventsRef, async (snapshot) => {
      console.log('Firestore snapshot received. Empty:', snapshot.empty);
      if (snapshot.empty && !seeding && events.length === 0) {
        console.log('Empty snapshot, seeding database...');
        setSeeding(true);
        // Seed the database with initial events
        try {
          const promises = INITIAL_EVENTS.map(event => {
            const { id, icon, date, endDate, ...rest } = event; 
            // Remove any undefined fields before saving to Firebase
            const cleanData = Object.fromEntries(
              Object.entries(rest).filter(([_, v]) => v !== undefined)
            );
            return addDoc(eventsRef, {
              ...cleanData,
              date: Timestamp.fromDate(date),
              endDate: endDate ? Timestamp.fromDate(endDate) : Timestamp.fromDate(date)
            });
          });
          await Promise.all(promises);
          console.log('Seeding successful');
        } catch (e: any) {
          console.error("Failed to seed initial events", e);
          setDbError("Erro ao gravar dados iniciais: " + e.message);
        } finally {
          setSeeding(false);
        }
        return;
      }
      
      const firestoreEvents: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let validDate = new Date();
        let validEndDate = new Date();
        
        try {
          if (data.date) {
            validDate = data.date.toDate ? data.date.toDate() : new Date(data.date);
          } else if (data.data_ini) {
            const [y, m, d] = data.data_ini.split('-').map(Number);
            const [h, min] = (data.hora_ini || '00:00').split(':').map(Number);
            validDate = new Date(y, m - 1, d, h, min);
          }

          if (data.endDate) {
            validEndDate = data.endDate.toDate ? data.endDate.toDate() : new Date(data.endDate);
          } else if (data.data_fim) {
            const [y, m, d] = data.data_fim.split('-').map(Number);
            const [h, min] = (data.hora_fim || '00:00').split(':').map(Number);
            validEndDate = new Date(y, m - 1, d, h, min);
          } else {
            validEndDate = validDate;
          }

          if (isNaN(validDate.getTime())) validDate = new Date();
          if (isNaN(validEndDate.getTime())) validEndDate = validDate;
        } catch (err) {
          console.error("Invalid date on event", docSnap.id, err);
        }

        firestoreEvents.push({
          ...data,
          id: docSnap.id,
          title: data.title || data.evento || data.Titulo || data.titulo || '',
          description: data.description || data.descricao || data.Descricao || data.beneficios || '',
          location: data.location || data.localidade || data.local || data.Local || '',
          category: data.category || data.tipo || 'Evento Interno',
          format: data.format || data.formato || 'Presencial',
          status: data.status || 'planejado',
          host: data.host || data.responsavel || 'Coordenação de Pautas',
          imageUrl: data.imageUrl || '',
          benefitsDeliverables: data.benefitsDeliverables || data.beneficios || data.entregas || '',
          internalObservations: data.internalObservations || data.obs || '',
          targetAudience: data.targetAudience || data.publico || '',
          responsibleAreas: data.responsibleAreas || data.areas || [],
          clientList: data.clientList || data.clientes || [],
          vipList: data.vipList || data.vips || [],
          techTeam: (data.equipe || data.techTeam || data.timeTecnico || []).map((m: any) => ({
            member: m.nome || m.member || '',
            role: m.funcao || m.role || '',
            size: m.tamanho || m.size || 'M'
          })),
          equipe: (data.equipe || data.techTeam || data.timeTecnico || []).map((m: any) => ({
            nome: m.nome || m.member || '',
            funcao: m.funcao || m.role || '',
            tamanho: m.tamanho || m.size || 'M'
          })),
          scope: data.scope || data.abrangencia || '',
          commercialQuota: data.commercialQuota || data.cotaComercial || '',
          linksAndRepos: data.linksAndRepos || data.links || '',
          staffCount: data.staffCount !== undefined ? data.staffCount : (data.qtdStaff || '0'),
          clientCount: data.clientCount !== undefined ? data.clientCount : (data.qtdClient || '0'),
          vipCount: data.vipCount !== undefined ? data.vipCount : (data.qtdVip || '0'),
          date: validDate,
          endDate: validEndDate
        });
      });
      console.log('Firebase events synced:', firestoreEvents);
      setEvents(firestoreEvents);
    }, (error) => {
      console.error("Error fetching events from Firestore:", error);
      setDbError("Missing or insufficient permissions. Verifique as regras do Firebase Firestore.");
    });

    return () => unsubscribe();
  }, [user]);

  // V2 Integration States
  const [activeMainTab, setActiveMainTab] = useState<string>('Eventos'); // Eventos, Inventário, Fornecedores, Viagens
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [viagens, setViagens] = useState<any[]>([]);
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubInv = onSnapshot(collection(db, 'inventario'), (snap) => setInventoryItems(prev => { const others = prev.filter(i => i._collection !== 'inventario'); return [...others, ...snap.docs.map(d => ({id: d.id, _collection: 'inventario', ...d.data()}))]; }));
    const unsubBri = onSnapshot(collection(db, 'brindes'), (snap) => setInventoryItems(prev => { const others = prev.filter(i => i._collection !== 'brindes'); return [...others, ...snap.docs.map(d => ({id: d.id, _collection: 'brindes', ...d.data()}))]; }));
    const unsubUni = onSnapshot(collection(db, 'uniformes'), (snap) => setInventoryItems(prev => { const others = prev.filter(i => i._collection !== 'uniformes'); return [...others, ...snap.docs.map(d => ({id: d.id, _collection: 'uniformes', ...d.data()}))]; }));
    const unsubEst = onSnapshot(collection(db, 'estoque'), (snap) => setInventoryItems(prev => { const others = prev.filter(i => i._collection !== 'estoque'); return [...others, ...snap.docs.map(d => ({id: d.id, _collection: 'estoque', ...d.data()}))]; }));
    const unsubFor = onSnapshot(collection(db, 'fornecedores'), (snap) => setFornecedores(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubVia = onSnapshot(collection(db, 'viagens'), (snap) => setViagens(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPar = onSnapshot(collection(db, 'participantes'), (snap) => setParticipantes(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setUsersList(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    return () => { unsubInv(); unsubBri(); unsubUni(); unsubEst(); unsubFor(); unsubVia(); unsubPar(); unsubUsers(); };
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      const updated = events.find(e => e.id === selectedEvent.id);
      if (updated) {
        const hasChanged = 
          updated.title !== selectedEvent.title ||
          updated.description !== selectedEvent.description ||
          updated.location !== selectedEvent.location ||
          updated.status !== selectedEvent.status ||
          updated.custo_real !== selectedEvent.custo_real ||
          (updated.lancamentos_financeiros?.length || 0) !== (selectedEvent.lancamentos_financeiros?.length || 0);

        if (hasChanged) {
          setSelectedEvent(updated);
        }
      }
    }
  }, [events]);

  const [currentView, setCurrentView] = useState<string>('cards'); 
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedFormat, setSelectedFormat] = useState<string>('Todos');
  const [selectedResponsible, setSelectedResponsible] = useState<string>('Todos');
  const [currentDate, setCurrentDate] = useState<Date>(new Date()); 
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  
  // Always show past events by default to prevent confusion about "missing" firebase data
  const [showPast, setShowPast] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Form hooks
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<string>('Dados Básicos');
  const [isGoogleSearchOpen, setIsGoogleSearchOpen] = useState<boolean>(false);
  const [googleSearchQuery, setGoogleSearchQuery] = useState<string>('');
  const [isSearchingGoogle, setIsSearchingGoogle] = useState<boolean>(false);
  const [googleSearchResult, setGoogleSearchResult] = useState<any>(null);
  const [googleSearchError, setGoogleSearchError] = useState<string | null>(null);
  
  // High-performance Editing & Form Grounding states
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newSourceUrl, setNewSourceUrl] = useState<string>('');
  const [newReasoning, setNewReasoning] = useState<string>('');
  // Inline Form Google Search Grounding & Approval states
  const [isSearchingGoogleInForm, setIsSearchingGoogleInForm] = useState<boolean>(false);
  const [formGoogleSearchResult, setFormGoogleSearchResult] = useState<any>(null);
  const [formGoogleSearchError, setFormGoogleSearchError] = useState<string | null>(null);
  const [selectedGoogleFields, setSelectedGoogleFields] = useState<Record<string, boolean>>({});

  const [isSearchingImage, setIsSearchingImage] = useState<boolean>(false);
  const [imageSearchResults, setImageSearchResults] = useState<string[]>([]);
  const [imageSearchError, setImageSearchError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Evento Interno');
  const [newStatus, setNewStatus] = useState<string>('planejado');
  const [newFormat, setNewFormat] = useState<string>('Presencial');
  const [newDateStr, setNewDateStr] = useState<string>('2026-05-16');
  const [newEndDateStr, setNewEndDateStr] = useState<string>('2026-05-16');
  const [newTimeStr, setNewTimeStr] = useState<string>('14:00');
  const [newEndTimeStr, setNewEndTimeStr] = useState<string>('16:00');
  const [newLocation, setNewLocation] = useState<string>('');
  const [newHost, setNewHost] = useState<string>('');
  const [newReminder, setNewReminder] = useState<string>('none');
  const [newCommercialQuota, setNewCommercialQuota] = useState<string>('');
  const [newLinksAndRepos, setNewLinksAndRepos] = useState<string>('');
  const [newStaffCount, setNewStaffCount] = useState<string>('0');
  const [newClientCount, setNewClientCount] = useState<string>('0');
  const [newVipCount, setNewVipCount] = useState<string>('0');
  
  // Financeiro V2
  const [newUf, setNewUf] = useState<string>('');
  const [newTipoFinanceiro, setNewTipoFinanceiro] = useState<string>('');
  const [newApuracaoFinalizada, setNewApuracaoFinalizada] = useState<boolean>(false);
  const [newCustoReal, setNewCustoReal] = useState<string>('');
  const [newPrevisaoPipe, setNewPrevisaoPipe] = useState<string>('');
  const [newPrevisaoFechamento, setNewPrevisaoFechamento] = useState<string>('');
  const [newReceitaEstimada, setNewReceitaEstimada] = useState<string>('');
  
  // Financeiro Legacy
  const [newOrcamentoTotal, setNewOrcamentoTotal] = useState<string>('');
  const [newCustoBrindes, setNewCustoBrindes] = useState<string>('');
  const [newCustoUniformes, setNewCustoUniformes] = useState<string>('');
  const [newCustoIngressos, setNewCustoIngressos] = useState<string>('');
  const [newCustoPassagens, setNewCustoPassagens] = useState<string>('');
  const [newCustoHospedagem, setNewCustoHospedagem] = useState<string>('');
  const [newCustoOutros, setNewCustoOutros] = useState<string>('');
  const [newOutrosCustosLista, setNewOutrosCustosLista] = useState<any[]>([]);

  // Logistica (Estoque Baixa)
  const [newEstoqueBaixaProcessada, setNewEstoqueBaixaProcessada] = useState<boolean>(false);

  const [newResponsibleAreas, setNewResponsibleAreas] = useState<string[]>([]);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientRole, setNewClientRole] = useState<string>('');
  const [newClientList, setNewClientList] = useState<{name: string, role: string}[]>([]);
  const [newVipName, setNewVipName] = useState<string>('');
  const [newVipObs, setNewVipObs] = useState<string>('');
  const [newVipList, setNewVipList] = useState<{name: string, obs: string}[]>([]);
  const [newTechMember, setNewTechMember] = useState<string>('');
  const [newTechRole, setNewTechRole] = useState<string>('');
  const [newTechSize, setNewTechSize] = useState<string>('M');
  const [newTechTeam, setNewTechTeam] = useState<{member: string, role: string, size: string}[]>([]);
  const [newTargetAudience, setNewTargetAudience] = useState<string>('');
  const [newBenefitsDeliverables, setNewBenefitsDeliverables] = useState<string>('');
  const [newInternalObservations, setNewInternalObservations] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  const [newAllocatedGifts, setNewAllocatedGifts] = useState<any[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string>('');
  const [selectedGiftQty, setSelectedGiftQty] = useState<number>(1);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lançamentos Financeiros e Planilha Excel V2
  const [newLancamentosFinanceiros, setNewLancamentosFinanceiros] = useState<any[]>([]);
  const [manualConta, setManualConta] = useState<string>('');
  const [manualDataLancamento, setManualDataLancamento] = useState<string>('');
  const [manualDataVencimento, setManualDataVencimento] = useState<string>('');
  const [manualObservacoes, setManualObservacoes] = useState<string>('');
  const [manualFornecedor, setManualFornecedor] = useState<string>('');
  const [manualValor, setManualValor] = useState<string>('');

  const [excelWorkbook, setExcelWorkbook] = useState<any>(null);
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [selectedExcelSheet, setSelectedExcelSheet] = useState<string>('');

  const handleAddManualLancamento = () => {
    if (!manualConta.trim() || !manualValor.trim()) {
      showToast('Por favor, informe a Conta e o Valor da despesa.');
      return;
    }
    const val = parseFloat(manualValor);
    if (isNaN(val)) {
      showToast('O valor informado é inválido.');
      return;
    }
    const newEntry = {
      descConta: manualConta.trim(),
      dataLancamento: manualDataLancamento || '',
      dataVencimento: manualDataVencimento || '',
      observacoes: manualObservacoes.trim(),
      fornecedor: manualFornecedor.trim(),
      valor: val
    };
    setNewLancamentosFinanceiros(prev => [...prev, newEntry]);
    
    // Limpar campos
    setManualConta('');
    setManualDataLancamento('');
    setManualDataVencimento('');
    setManualObservacoes('');
    setManualFornecedor('');
    setManualValor('');
    showToast('Lançamento adicionado manualmente!');
  };

  const handleRemoveLancamento = (idx: number) => {
    setNewLancamentosFinanceiros(prev => prev.filter((_, i) => i !== idx));
    showToast('Lançamento removido.');
  };

  const processSheet = (wb: any, sheetName: string) => {
    try {
      const sheet = wb.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      
      let headerIdx = -1;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i] || [];
        if (row.some((cell: any) => typeof cell === 'string' && (cell.toLowerCase().includes('desc conta') || cell.toLowerCase().includes('debito') || cell.toLowerCase().includes('vencimento') || cell.toLowerCase().includes('lançamento')))) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx === -1) {
        headerIdx = rows.length > 1 ? 1 : 0;
      }

      const headers = (rows[headerIdx] || []).map((h: any) => String(h || '').trim().toLowerCase());
      
      const descContaIdx = headers.findIndex(h => h.includes('desc conta') || h.includes('categoria') || h.includes('conta'));
      const dataLancamentoIdx = headers.findIndex(h => h.includes('lançamento') || h.includes('lancamento') || h.includes('data de lançamento'));
      const dataVencimentoIdx = headers.findIndex(h => h.includes('vencimento') || h.includes('data de vencimento'));
      const observacoesIdx = headers.findIndex(h => h.includes('observações') || h.includes('observacoes') || h.includes('descrição') || h.includes('observacao'));
      const fornecedorIdx = headers.findIndex(h => h.includes('fornecedor') || h.includes('nome conta contrap') || h.includes('contrapartida') || h.includes('parceiro'));
      const valorIdx = headers.findIndex(h => h.includes('débito/crédito') || h.includes('debito') || h.includes('valor') || h.includes('mc'));

      const parsed: any[] = [];
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        if (row.length === 0 || row.every((c: any) => c === null || c === undefined || c === '')) continue;
        
        const rawVal = valorIdx !== -1 ? row[valorIdx] : 0;
        const val = parseFloat(rawVal) || 0;
        
        parsed.push({
          descConta: descContaIdx !== -1 && row[descContaIdx] !== undefined && row[descContaIdx] !== null ? String(row[descContaIdx]) : 'Outros',
          dataLancamento: dataLancamentoIdx !== -1 && row[dataLancamentoIdx] !== undefined && row[dataLancamentoIdx] !== null ? row[dataLancamentoIdx] : '',
          dataVencimento: dataVencimentoIdx !== -1 && row[dataVencimentoIdx] !== undefined && row[dataVencimentoIdx] !== null ? row[dataVencimentoIdx] : '',
          observacoes: observacoesIdx !== -1 && row[observacoesIdx] !== undefined && row[observacoesIdx] !== null ? String(row[observacoesIdx]) : '',
          fornecedor: fornecedorIdx !== -1 && row[fornecedorIdx] !== undefined && row[fornecedorIdx] !== null ? String(row[fornecedorIdx]) : '',
          valor: val
        });
      }

      if (parsed.length === 0) {
        showToast('Nenhum lançamento válido encontrado na aba ' + sheetName);
        return;
      }

      setNewLancamentosFinanceiros(prev => [...prev, ...parsed]);
      showToast(`Sucesso! Importados ${parsed.length} lançamentos da aba "${sheetName}".`);
      
      setExcelWorkbook(null);
      setExcelSheets([]);
      setSelectedExcelSheet('');
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao processar aba: ' + err.message);
    }
  };

  const handleExcelImport = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        setExcelWorkbook(wb);
        setExcelSheets(wb.SheetNames);
        if (wb.SheetNames.length === 1) {
          processSheet(wb, wb.SheetNames[0]);
        } else {
          setSelectedExcelSheet(wb.SheetNames[0]);
        }
      } catch (err: any) {
        console.error(err);
        showToast('Erro ao ler a planilha: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
    // Clear input value so upload fires again for same file name
    evt.target.value = '';
  };

  const handleConfirmExcelImport = () => {
    if (!excelWorkbook || !selectedExcelSheet) return;
    processSheet(excelWorkbook, selectedExcelSheet);
  };

  const handleCancelExcelImport = () => {
    setExcelWorkbook(null);
    setExcelSheets([]);
    setSelectedExcelSheet('');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedEventIds.includes(id)) {
      setSavedEventIds(savedEventIds.filter(item => item !== id));
      showToast('Removido dos favoritos do espaço corporativo.');
    } else {
      setSavedEventIds([...savedEventIds, id]);
      showToast('Adicionado aos seus favoritos pessoais com sucesso.');
    }
  };

  const uniqueCategories = useMemo(() => {
    const cats = events
      .map(e => e.category)
      .filter(Boolean);
    return ['Todos', ...Array.from(new Set(cats))];
  }, [events]);

  const uniqueStatuses = useMemo(() => {
    const stats = events
      .map(e => e.status)
      .filter(Boolean);
    return ['Todos', ...Array.from(new Set(stats))];
  }, [events]);

  const uniqueFormats = useMemo(() => {
    const fmts = events
      .map(e => e.format)
      .filter(Boolean);
    return ['Todos', ...Array.from(new Set(fmts))];
  }, [events]);

  const uniqueResponsibles = useMemo(() => {
    const resps = events
      .map(e => e.host)
      .filter(Boolean);
    return ['Todos', ...Array.from(new Set(resps))];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const todayBaseline = new Date();
    todayBaseline.setHours(0, 0, 0, 0);

    return events.filter(event => {
      const matchesSearch = (event.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                            (event.description || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                            (event.location || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                            (event.host && (event.host || '').toLowerCase().includes((searchQuery || '').toLowerCase()));
      
      const matchesCategory = selectedCategory === 'Todos' || event.category === selectedCategory;
      const matchesStatus = selectedStatus === 'Todos' || event.status === selectedStatus;
      const matchesFormat = selectedFormat === 'Todos' || event.format === selectedFormat;
      const matchesResponsible = selectedResponsible === 'Todos' || event.host === selectedResponsible;

      const eventDay = new Date(event.date);
      eventDay.setHours(0, 0, 0, 0);
      const isPastEvent = eventDay < todayBaseline;
      const matchesPastFilter = showPast ? true : !isPastEvent;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesFormat && matchesResponsible && matchesPastFilter;
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, searchQuery, selectedCategory, selectedStatus, selectedFormat, selectedResponsible, showPast]);

  const exportToICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Calendario 2505//BR\n";
    filteredEvents.forEach(event => {
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:${event.title}\n`;
      icsContent += `DESCRIPTION:${event.description || ''}\n`;
      if (event.location) {
        icsContent += `LOCATION:${event.location}\n`;
      }
      
      const startDate = new Date(event.date);
      let y = startDate.getFullYear();
      let m = String(startDate.getMonth() + 1).padStart(2, '0');
      let d = String(startDate.getDate()).padStart(2, '0');
      
      icsContent += `DTSTART;VALUE=DATE:${y}${m}${d}\n`;
      
      const endDate = event.endDate ? new Date(event.endDate) : startDate;
      // Add 1 day to end date for all-day events in ICS
      const endDateClone = new Date(endDate);
      endDateClone.setDate(endDateClone.getDate() + 1);
      
      let ey = endDateClone.getFullYear();
      let em = String(endDateClone.getMonth() + 1).padStart(2, '0');
      let ed = String(endDateClone.getDate()).padStart(2, '0');
      
      icsContent += `DTEND;VALUE=DATE:${ey}${em}${ed}\n`;
      
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calendario.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Calendário exportado com sucesso.');
  };

  const handlePrevDate = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'monthly') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === 'weekly') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'monthly') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === 'weekly') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDateToInput = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatTimeToInput = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${min}`;
  };

  const handleOpenCreateModal = () => {
    setNewTitle('');
    setNewDesc('');
    setNewCategory('Evento Interno');
    setNewStatus('planejado');
    setNewFormat('Presencial');
    setNewDateStr('2026-05-16');
    setNewEndDateStr('2026-05-16');
    setNewTimeStr('14:00');
    setNewEndTimeStr('16:00');
    setNewLocation('');
    setNewHost('');
    setNewReminder('none');
    setNewCommercialQuota('');
    setNewLinksAndRepos('');
    setNewStaffCount('0');
    setNewClientCount('0');
    setNewVipCount('0');
    setNewResponsibleAreas([]);
    setNewClientList([]);
    setNewVipList([]);
    setNewTechTeam([]);
    setNewTargetAudience('');
    setNewBenefitsDeliverables('');
    setNewInternalObservations('');
    setEditingEventId(null);
    setNewSourceUrl('');
    setNewReasoning('');
    setFormGoogleSearchResult(null);
    setFormGoogleSearchError(null);

    // Reset Financeiro V2
    setNewUf('');
    setNewTipoFinanceiro('');
    setNewApuracaoFinalizada(false);
    setNewCustoReal('');
    setNewPrevisaoPipe('');
    setNewPrevisaoFechamento('');
    setNewReceitaEstimada('');
    setNewLancamentosFinanceiros([]);

    setActiveModalTab('Dados Básicos');
    setIsAddOpen(true);
  };

  const handleStartEdit = (event: any) => {
    setNewTitle(event.title);
    setNewDesc(event.description || '');
    setNewCategory(event.category);
    setNewStatus(event.status || 'planejado');
    setNewFormat(event.format || 'Presencial');
    setNewDateStr(formatDateToInput(event.date));
    setNewEndDateStr(formatDateToInput(event.endDate || event.date));
    setNewTimeStr(formatTimeToInput(event.date));
    setNewEndTimeStr(formatTimeToInput(event.endDate));
    setNewLocation(event.location || '');
    setNewHost(event.host || '');
    setNewReminder(event.reminder || 'none');
    
    setNewCommercialQuota(event.commercialQuota || '');
    setNewLinksAndRepos(event.linksAndRepos || '');
    setNewStaffCount(event.staffCount?.toString() || '0');
    setNewClientCount(event.clientCount?.toString() || '0');
    setNewVipCount(event.vipCount?.toString() || '0');
    setNewResponsibleAreas(event.responsibleAreas || []);
    setNewClientList(event.clientList || []);
    setNewVipList(event.vipList || []);
    setNewTechTeam((event.equipe || event.techTeam || []).map((m: any) => ({
      member: m.nome || m.member || '',
      role: m.funcao || m.role || '',
      size: m.tamanho || m.size || 'M'
    })));
    setNewTargetAudience(event.targetAudience || '');
    setNewBenefitsDeliverables(event.benefitsDeliverables || '');
    setNewInternalObservations(event.internalObservations || '');
    setNewImageUrl(event.imageUrl || '');
    setNewAllocatedGifts(event.brindes_alocados || []);

    setEditingEventId(event.id);
    
    // Support sourcing meta info
    setNewSourceUrl(event.sourceUrl || '');
    setNewReasoning(event.reasoning || '');
    
    // Financeiro V2
    setNewUf(event.uf || '');
    setNewTipoFinanceiro(event.tipo_financeiro || '');
    setNewApuracaoFinalizada(event.apuracao_finalizada || false);
    setNewCustoReal(event.custo_real?.toString() || '');
    setNewPrevisaoPipe(event.previsao_pipe?.toString() || '');
    setNewPrevisaoFechamento(event.previsao_fechamento?.toString() || '');
    setNewReceitaEstimada(event.receita_estimada?.toString() || '');
    setNewLancamentosFinanceiros(event.lancamentos_financeiros || []);

    // Financeiro Legacy
    setNewOrcamentoTotal(event.orcamento_total?.toString() || '');
    setNewCustoBrindes(event.custo_brindes?.toString() || '');
    setNewCustoUniformes(event.custo_uniformes?.toString() || '');
    setNewCustoIngressos(event.custo_ingressos?.toString() || '');
    setNewCustoPassagens(event.custo_passagens?.toString() || '');
    setNewCustoHospedagem(event.custo_hospedagem?.toString() || '');
    setNewCustoOutros(event.custo_outros?.toString() || '');
    setNewOutrosCustosLista(event.outros_custos_lista || []);

    setNewEstoqueBaixaProcessada(event.estoque_baixa_processada || false);

    
    // Clear other search states
    setFormGoogleSearchResult(null);
    setFormGoogleSearchError(null);
    
    setActiveModalTab('Dados Básicos');
    setIsAddOpen(true);
    setSelectedEvent(null);
  };

  const adjustStock = async (oldGifts: any[] = [], newGifts: any[] = []) => {
    const oldMap = new Map(oldGifts.map(g => [g.docId || g.id, g]));
    const newMap = new Map(newGifts.map(g => [g.docId || g.id, g]));

    for (const newG of newGifts) {
      const gId = newG.docId || newG.id;
      const oldG = oldMap.get(gId);
      const change = newG.qtd - (oldG ? oldG.qtd : 0);
      if (change !== 0) {
        const item = inventoryItems.find(i => i.id === gId);
        if (item) {
          const col = item._collection || newG._collection || 'inventario';
          const docRef = doc(db, col, gId);
          const currentQty = Number(item.quantidade) || 0;
          await updateDoc(docRef, { quantidade: Math.max(0, currentQty - change) });
        }
      }
    }

    for (const oldG of oldGifts) {
      const gId = oldG.docId || oldG.id;
      if (!newMap.has(gId)) {
        const item = inventoryItems.find(i => i.id === gId);
        const col = oldG._collection || item?._collection || 'inventario';
        const docRef = doc(db, col, gId);
        const currentQty = item ? (Number(item.quantidade) || 0) : 0;
        await updateDoc(docRef, { quantidade: currentQty + oldG.qtd });
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Deseja realmente excluir este evento do hub?')) return;
    try {
      const event = events.find(e => e.id === eventId);
      if (event && event.brindes_alocados) {
        await adjustStock(event.brindes_alocados, []);
      }
      await deleteDoc(doc(db, 'eventos', eventId));
      setIsAddOpen(false);
      setSelectedEvent(null);
      showToast('Evento excluído com sucesso.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir evento.');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDateStr || !newTimeStr) {
      showToast('Insira as pautas obrigatórias do formulário.');
      return;
    }

    try {

    const [year, month, day] = newDateStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = (newEndDateStr || newDateStr).split('-').map(Number);
    const [hour, min] = newTimeStr.split(':').map(Number);
    const [endHour, endMin] = newEndTimeStr.split(':').map(Number);

    const eventStartDate = new Date(year, month - 1, day, hour, min);
    const eventEndDate = new Date(endYear, endMonth - 1, endDay, endHour, endMin);

    const isHoli = newCategory === 'Feriado';

    const gradients = [
      'from-fuchsia-600 via-indigo-600 to-violet-600',
      'from-emerald-500 via-teal-600 to-cyan-500',
      'from-amber-500 via-orange-600 to-rose-500',
      'from-sky-500 via-blue-600 to-indigo-600'
    ];

    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    const icons: Record<string, any> = {
      'Comercial Interno': Briefcase,
      'Comercial Patrocinado': Sparkles,
      'Evento Interno': Cpu,
      'Feriado': Flag
    };

    if (editingEventId) {
      // Editing Mode
      const oldGifts = events.find(ev => ev.id === editingEventId)?.brindes_alocados || [];
      await adjustStock(oldGifts, newAllocatedGifts);
      const docRef = doc(db, 'eventos', editingEventId);
      await updateDoc(docRef, {
        title: newTitle,
        description: newDesc || 'Sem pauta adicional descrita.',
        date: Timestamp.fromDate(eventStartDate),
        endDate: Timestamp.fromDate(eventEndDate),
        location: newLocation,
        category: newCategory,
        format: newFormat,
        status: isHoli ? 'confirmado' : newStatus,
        color: newCategory.toLowerCase().replace(' ', '-'),
        isHoliday: isHoli,
        host: newHost || 'Coordenação de Pautas',
        reminder: newReminder,
        commercialQuota: newCommercialQuota,
        linksAndRepos: newLinksAndRepos,
        staffCount: parseInt(newStaffCount) || 0,
        clientCount: parseInt(newClientCount) || 0,
        vipCount: parseInt(newVipCount) || 0,
        responsibleAreas: newResponsibleAreas,
        clientList: newClientList,
        vipList: newVipList,
        techTeam: newTechTeam,
        equipe: newTechTeam.map(t => ({ nome: t.member, funcao: t.role, tamanho: t.size })),
        targetAudience: newTargetAudience,
        benefitsDeliverables: newBenefitsDeliverables,
        internalObservations: newInternalObservations,
        imageUrl: newImageUrl,
        sourceUrl: newSourceUrl,
        reasoning: newReasoning,
        
        uf: newUf,
        tipo_financeiro: newTipoFinanceiro,
        apuracao_finalizada: newApuracaoFinalizada,
        custo_real: newLancamentosFinanceiros.reduce((acc, l) => acc + (Number(l.valor) || 0), 0),
        previsao_pipe: parseFloat(newPrevisaoPipe) || 0,
        previsao_fechamento: parseFloat(newPrevisaoFechamento) || 0,
        receita_estimada: parseFloat(newReceitaEstimada) || 0,
        lancamentos_financeiros: newLancamentosFinanceiros,

        orcamento_total: parseFloat(newOrcamentoTotal) || 0,
        custo_brindes: parseFloat(newCustoBrindes) || 0,
        custo_uniformes: parseFloat(newCustoUniformes) || 0,
        custo_ingressos: parseFloat(newCustoIngressos) || 0,
        custo_passagens: parseFloat(newCustoPassagens) || 0,
        custo_hospedagem: parseFloat(newCustoHospedagem) || 0,
        custo_outros: parseFloat(newCustoOutros) || 0,
        outros_custos_lista: newOutrosCustosLista,

        estoque_baixa_processada: newEstoqueBaixaProcessada,
        brindes_alocados: newAllocatedGifts
      });
      setIsAddOpen(false);
      showToast(`O evento "${newTitle}" foi atualizado com sucesso no banco de dados!`);
    } else {
      // Creation Mode
      const newEvent = {
        title: newTitle,
        description: newDesc || 'Sem pauta adicional descrita.',
        date: Timestamp.fromDate(eventStartDate),
        endDate: Timestamp.fromDate(eventEndDate),
        location: newLocation,
        category: newCategory,
        format: newFormat,
        status: isHoli ? 'confirmado' : newStatus,
        gradient: isHoli ? 'from-neutral-800 to-neutral-950' : randomGradient,
        color: newCategory.toLowerCase().replace(' ', '-'),
        members: isHoli ? [] : [PREMIUM_AVATARS[0], PREMIUM_AVATARS[2]],
        isHoliday: isHoli,
        host: newHost || 'Coordenação de Pautas',
        reminder: newReminder,
        commercialQuota: newCommercialQuota,
        linksAndRepos: newLinksAndRepos,
        staffCount: parseInt(newStaffCount) || 0,
        clientCount: parseInt(newClientCount) || 0,
        vipCount: parseInt(newVipCount) || 0,
        responsibleAreas: newResponsibleAreas,
        clientList: newClientList,
        vipList: newVipList,
        techTeam: newTechTeam,
        equipe: newTechTeam.map(t => ({ nome: t.member, funcao: t.role, tamanho: t.size })),
        targetAudience: newTargetAudience,
        benefitsDeliverables: newBenefitsDeliverables,
        internalObservations: newInternalObservations,
        imageUrl: newImageUrl,
        scope: 'Nacional',
        sourceUrl: newSourceUrl,
        reasoning: newReasoning,
        
        uf: newUf,
        tipo_financeiro: newTipoFinanceiro,
        apuracao_finalizada: newApuracaoFinalizada,
        custo_real: newLancamentosFinanceiros.reduce((acc, l) => acc + (Number(l.valor) || 0), 0),
        previsao_pipe: parseFloat(newPrevisaoPipe) || 0,
        previsao_fechamento: parseFloat(newPrevisaoFechamento) || 0,
        receita_estimada: parseFloat(newReceitaEstimada) || 0,
        lancamentos_financeiros: newLancamentosFinanceiros,

        orcamento_total: parseFloat(newOrcamentoTotal) || 0,
        custo_brindes: parseFloat(newCustoBrindes) || 0,
        custo_uniformes: parseFloat(newCustoUniformes) || 0,
        custo_ingressos: parseFloat(newCustoIngressos) || 0,
        custo_passagens: parseFloat(newCustoPassagens) || 0,
        custo_hospedagem: parseFloat(newCustoHospedagem) || 0,
        custo_outros: parseFloat(newCustoOutros) || 0,
        outros_custos_lista: newOutrosCustosLista,

        estoque_baixa_processada: newEstoqueBaixaProcessada,
        brindes_alocados: newAllocatedGifts
      };
      
      await adjustStock([], newAllocatedGifts);
      const eventsRef = collection(db, 'eventos');
      await addDoc(eventsRef, newEvent);
      
      setIsAddOpen(false);
      showToast(`O evento "${newTitle}" foi inserido no hub corporativo.`);
    }
    
    // Clear form states
    setNewTitle('');
    setNewDesc('');
    setNewLocation('');
    setNewHost('');
    setNewReminder('none');
    setNewCommercialQuota('');
    setNewLinksAndRepos('');
    setNewStaffCount('0');
    setNewClientCount('0');
    setNewVipCount('0');
    setNewResponsibleAreas([]);
    setNewClientList([]);
    setNewVipList([]);
    setNewTechTeam([]);
    setNewTargetAudience('');
    setNewAllocatedGifts([]);
    setSelectedGiftId('');
    setSelectedGiftQty(1);
    setSelectedParticipantId('');
    setNewBenefitsDeliverables('');
    setNewInternalObservations('');
    setEditingEventId(null);
    setNewSourceUrl('');
    setNewReasoning('');
    
    setNewUf('');
    setNewTipoFinanceiro('');
    setNewApuracaoFinalizada(false);
    setNewCustoReal('');
    setNewPrevisaoPipe('');
    setNewPrevisaoFechamento('');
    setNewReceitaEstimada('');
    setNewLancamentosFinanceiros([]);
    
    setNewOrcamentoTotal('');
    setNewCustoBrindes('');
    setNewCustoUniformes('');
    setNewCustoIngressos('');
    setNewCustoPassagens('');
    setNewCustoHospedagem('');
    setNewCustoOutros('');
    setNewOutrosCustosLista([]);
    
    setNewEstoqueBaixaProcessada(false);

      setFormGoogleSearchResult(null);
      setFormGoogleSearchError(null);
    } catch (err: any) {
      console.error("Erro ao salvar o evento:", err);
      showToast("Erro ao salvar o evento: " + err.message);
    }
  };

  const handleInlineGoogleSearch = async () => {
    if (!newTitle || !newTitle.trim()) {
      showToast('Por favor, digite o título do evento / pauta para a IA pesquisar no Google.');
      return;
    }
    
    setIsSearchingGoogleInForm(true);
    setFormGoogleSearchError(null);
    setFormGoogleSearchResult(null);
    
    try {
      // Combina o título e a data (se preenchida) para uma busca muito mais precisa
      const searchQuery = newDateStr ? `${newTitle} data ${newDateStr}` : newTitle;
      
      const response = await fetch('/api/search-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao consultar a inteligência de busca do Google.');
      }
      
      const data = await response.json();
      setFormGoogleSearchResult(data);
      
      // Inicializar todas as chaves retornadas como "selecionadas" (true) por padrão
      const initialSelection: Record<string, boolean> = {};
      Object.keys(data).forEach(k => {
        if (data[k]) initialSelection[k] = true;
      });
      setSelectedGoogleFields(initialSelection);
      
      showToast('Busca concluída! Aprove o preenchimento abaixo.');
    } catch (err: any) {
      console.error(err);
      setFormGoogleSearchError(err.message || 'Erro desconhecido ao carregar os dados de busca do Google.');
    } finally {
      setIsSearchingGoogleInForm(false);
    }
  };

  const handleImageSearch = async () => {
    if (!newTitle || !newTitle.trim()) {
      showToast('Digite o nome do evento para buscar uma imagem.');
      return;
    }
    setIsSearchingImage(true);
    setImageSearchError(null);
    setImageSearchResults([]);
    try {
      const response = await fetch('/api/search-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: newTitle })
      });
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setImageSearchResults(data.results);
      } else {
        throw new Error('Nenhuma imagem encontrada.');
      }
    } catch (err: any) {
      setImageSearchError(err.message);
    } finally {
      setIsSearchingImage(false);
    }
  };

  const handleApproveFormGoogleSearch = () => {
    if (!formGoogleSearchResult) return;
    
    const data = formGoogleSearchResult;
    const sel = selectedGoogleFields;
    
    if (data.title && sel['title']) setNewTitle(data.title);
    if (data.description && sel['description']) setNewDesc(data.description);
    
    let isHoli = false;
    // Map Category
    if (data.category && sel['category']) {
      let categoryMap = 'Evento Interno';
      if (data.category === 'feriado_nacional' || data.category === 'feriado_bh' || data.category === 'feriado_sp') {
        categoryMap = 'Feriado';
      } else if (data.category === 'comercial_tripla') {
        categoryMap = 'Comercial Interno';
      } else if (data.category === 'comercial_patrocinado') {
        categoryMap = 'Comercial Patrocinado';
      }
      setNewCategory(categoryMap);

      isHoli = categoryMap === 'Feriado';
      setNewFormat(isHoli ? 'Presencial' : 'Híbrido');
    }
    
    // Date
    if (data.date && sel['date']) {
      setNewDateStr(data.date);
      setNewEndDateStr(data.endDate || data.date);
    }
    
    // Time
    if (data.time) {
      setNewTimeStr(data.time);
      if (data.endTime) {
        setNewEndTimeStr(data.endTime);
      } else {
        try {
          const [h, m] = data.time.split(':').map(Number);
          const endH = String((h + 2) % 24).padStart(2, '0');
          setNewEndTimeStr(`${endH}:${String(m).padStart(2, '0')}`);
        } catch (e) {
          setNewEndTimeStr('18:00');
        }
      }
    } else {
      setNewTimeStr('09:00');
      setNewEndTimeStr('11:00');
    }
    
    if (data.endDate) {
       setNewEndDateStr(data.endDate);
    }
    
    if (data.location) {
      setNewLocation(data.location);
    } else {
      setNewLocation(isHoli ? 'Brasil' : 'Remoto');
    }

    if (data.linksAndRepos && sel['linksAndRepos']) setNewLinksAndRepos(data.linksAndRepos);
    if (data.targetAudience && sel['targetAudience']) setNewTargetAudience(data.targetAudience);
    if (data.benefitsDeliverables && sel['benefitsDeliverables']) setNewBenefitsDeliverables(data.benefitsDeliverables);
    if (data.internalObservations && sel['internalObservations']) setNewInternalObservations(data.internalObservations);

    setNewHost('Google Search Assistant');
    setNewSourceUrl(data.source_url || '');
    setNewReasoning(data.reasoning || '');
    
    setFormGoogleSearchResult(null);
    showToast('Campos do formulário preenchidos automaticamente com aprovação!');
  };

  const handleGoogleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleSearchQuery || !googleSearchQuery.trim()) return;
    
    setIsSearchingGoogle(true);
    setGoogleSearchError(null);
    setGoogleSearchResult(null);
    
    try {
      const response = await fetch('/api/search-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: googleSearchQuery })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao consultar a inteligência de busca do Google.');
      }
      
      const data = await response.json();
      setGoogleSearchResult(data);
      showToast('Pesquisa no Google efetuada com sucesso!');
    } catch (err: any) {
      console.error(err);
      setGoogleSearchError(err.message || 'Erro desconhecido ao carregar os dados de busca.');
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const handleAddGoogleSearchResult = () => {
    if (!googleSearchResult) return;
    
    // Parse Date
    let eventDate = new Date();
    try {
      if (googleSearchResult.date) {
        const [y, m, d] = googleSearchResult.date.split('-').map(Number);
        const [h, min] = (googleSearchResult.time || "09:00").split(':').map(Number);
        eventDate = new Date(y, m - 1, d, h, min);
      }
    } catch (e) {
      eventDate = new Date();
    }
    
    const endHour = eventDate.getHours() + 2;
    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(endHour);

    const isHoli = googleSearchResult.category.includes('feriado');
    
    const gradients = [
      'from-fuchsia-600 via-indigo-600 to-violet-600',
      'from-emerald-500 via-teal-600 to-cyan-500',
      'from-amber-500 via-orange-600 to-rose-500',
      'from-sky-500 via-blue-600 to-indigo-600'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    // Map Category
    let categoryMap = 'Evento Interno';
    if (googleSearchResult.category === 'feriado_nacional' || googleSearchResult.category === 'feriado_bh' || googleSearchResult.category === 'feriado_sp') {
      categoryMap = 'Feriado';
    } else if (googleSearchResult.category === 'comercial_tripla') {
      categoryMap = 'Comercial Interno';
    } else if (googleSearchResult.category === 'comercial_patrocinado') {
      categoryMap = 'Comercial Patrocinado';
    }

    const icons: Record<string, any> = {
      'Comercial Interno': Briefcase,
      'Comercial Patrocinado': Sparkles,
      'Evento Interno': Cpu,
      'Feriado': Flag
    };

    const newEvent = {
      title: googleSearchResult.title,
      description: googleSearchResult.description || 'Pauta gerada a partir de busca pública no Google.',
      date: Timestamp.fromDate(eventDate),
      endDate: Timestamp.fromDate(eventEndDate),
      location: googleSearchResult.location || 'Brasil / Remoto',
      category: categoryMap,
      format: isHoli ? 'Presencial' : 'Híbrido',
      status: 'confirmado',
      gradient: isHoli ? 'from-neutral-800 to-neutral-950' : randomGradient,
      color: categoryMap.toLowerCase().replace(' ', '-'),
      members: isHoli ? [] : [PREMIUM_AVATARS[1], PREMIUM_AVATARS[3]],
      isHoliday: isHoli,
      host: 'Google Search Assistant',
      scope: googleSearchResult.category === 'feriado_nacional' ? 'Nacional' : 'Regional',
      sourceUrl: googleSearchResult.source_url,
      reasoning: googleSearchResult.reasoning
    };

    const eventsRef = collection(db, 'eventos');
    addDoc(eventsRef, newEvent);
    
    setIsGoogleSearchOpen(false);
    showToast(`O evento "${newEvent.title}" foi importado via Google Search!`);
    
    // Clear
    setGoogleSearchQuery('');
    setGoogleSearchResult(null);
  };

  const viewOptions = [
    { id: 'cards', label: 'Cards', icon: Grid },
    { id: 'timeline', label: 'Timeline', icon: List },
    { id: 'monthly', label: 'Mensal', icon: Calendar },
    { id: 'weekly', label: 'Semanal', icon: Layers },
  ];
  const activeViewIndex = viewOptions.findIndex(v => v.id === currentView);

  if (authLoading) {
    return (
      <div className="min-h-screen font-sans bg-slate-50 dark:bg-zinc-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  if (userRole !== 'admin' && userRole !== 'approved') {
    return (
      <div className={`min-h-screen font-sans flex items-center justify-center p-4 transition-colors duration-500 relative overflow-hidden ${
        darkMode ? 'dark bg-zinc-950 text-white' : 'bg-slate-50/50 text-zinc-900'
      }`}>
        {/* Floating Dynamic Ambient Orbs */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-35 dark:opacity-70">
          <div className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent blur-[140px] animate-float-1" />
          <div className="absolute -bottom-[15%] right-[5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-fuchsia-500/8 via-purple-500/8 to-transparent blur-[130px] animate-float-3" />
        </div>

        <div className={`relative z-10 w-full max-w-md p-8 rounded-[32px] border shadow-2xl backdrop-blur-md transition-all ${
          darkMode ? 'bg-zinc-900/60 border-white/5 shadow-black/40' : 'bg-white/80 border-slate-200/60 shadow-slate-200/50'
        }`}>
          <div className="flex flex-col items-center text-center">
            {/* Pulsing icon container */}
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative ${
              darkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-505 border border-amber-200'
            }`}>
              <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping opacity-75" style={{ animationDuration: '3s' }} />
              <Clock className="h-8 w-8 relative z-10" />
            </div>

            <h3 className="text-xl font-bold tracking-tight font-display mb-2">
              Acesso Pendente de Aprovação
            </h3>
            <p className={`text-xs leading-relaxed mb-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Sua conta com o e-mail <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user.email}</span> foi cadastrada com sucesso.
              <br /><br />
              Para garantir a segurança do sistema, um administrador precisa aprovar o seu acesso para liberar o Hub do Calendário Estratégico.
            </p>

            <div className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 mb-6 ${
              darkMode ? 'bg-zinc-950/40 border-white/5 text-zinc-400' : 'bg-slate-50 border-slate-200/50 text-zinc-650'
            }`}>
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-indigo-500" />
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">Fluxo de Aprovação</h5>
                <p className="text-[10px] mt-0.5 leading-relaxed">
                  Assim que sua conta for aprovada pelo administrador, esta página será atualizada automaticamente e seu acesso será concedido em tempo real.
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut(auth)}
              className="w-full inline-flex justify-center items-center py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </button>

            {/* Expandable Diagnostic Panel */}
            <details className={`w-full mt-6 text-left border rounded-2xl overflow-hidden transition-all ${
              darkMode ? 'bg-zinc-950/20 border-white/5 text-zinc-400' : 'bg-slate-50/50 border-slate-200/80 text-zinc-650'
            }`}>
              <summary className="p-3 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 select-none">
                Diagnóstico de Usuários (Firestore)
              </summary>
              <div className="p-4 border-t border-slate-200/50 dark:border-white/5 space-y-3 font-mono text-[9px]">
                <div>
                  <span className="font-bold">UID Local:</span> {user.uid}
                </div>
                <div>
                  <span className="font-bold">Email Autenticado:</span> {user.email}
                </div>
                <div>
                  <span className="font-bold">Role Detectada:</span> <span className="font-bold text-amber-500">{userRole}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/20 dark:border-white/5">
                  <span className="font-bold uppercase block mb-1">Coleção 'users' no Firestore ({usersList.length}):</span>
                  {usersList.length === 0 ? (
                    <span className="text-zinc-500 italic">Nenhum usuário listado ou sem permissão de leitura.</span>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {usersList.map((u, idx) => (
                        <div key={idx} className="flex justify-between border-b border-slate-200/10 dark:border-white/5 pb-0.5">
                          <span className="truncate max-w-[200px]">{u.email}</span>
                          <span className={`font-bold shrink-0 ${u.role === 'admin' ? 'text-red-500' : u.role === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {u.role || 'pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-500 relative overflow-hidden ${darkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-slate-50/50 text-zinc-900'}`}>
      
      {/* Dynamic font stylesheet configuration */}
      <style>{typographyStyles}</style>

      {/* Floating Dynamic Ambient Orbs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-35 dark:opacity-70">
        <div className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent blur-[140px] animate-float-1" />
        <div className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-cyan-500/10 via-sky-500/10 to-transparent blur-[150px] animate-float-2" />
        <div className="absolute -bottom-[15%] left-[5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-fuchsia-500/8 via-purple-500/8 to-transparent blur-[130px] animate-float-3" />
      </div>

      {/* Bottom Compact Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 animate-[spring-in_0.3s_ease] flex items-center space-x-3.5 bg-zinc-900/95 dark:bg-white text-white dark:text-zinc-950 px-5 py-4 rounded-2xl shadow-2xl border border-white/10 dark:border-zinc-200/50 max-w-sm">
          <CheckCircle2 className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-600 shrink-0" />
          <p className="text-[11px] font-medium tracking-wide leading-tight">{toastMessage}</p>
        </div>
      )}

      {/* App Header */}
      <header className={`sticky top-0 z-45 backdrop-blur-2xl border-b transition-all duration-300 ${
        darkMode ? 'bg-zinc-950/70 border-white/5' : 'bg-white/70 border-slate-200/50'
      }`}>
        <div className="w-full px-6 lg:px-12 xl:px-16 h-20 flex items-center justify-between">
          
          {/* Workspace Brand Logo & Main Tabs */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <img 
                src={darkMode ? logoWhite : logoColor} 
                alt="Tripla Logo" 
                className="h-10 w-auto object-contain transition-all duration-300"
              />
              <div className="hidden xl:block">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 tracking-wider uppercase">
                    Portal
                  </span>
                </div>
                <p className="text-[9px] font-bold tracking-[0.14em] uppercase text-zinc-400 dark:text-zinc-500 mt-0.5">Calendário Geral de Eventos & Feriados 2026</p>
              </div>
            </div>

            {/* Main Tabs in Header */}
            <div className={`p-1 rounded-2xl border flex items-center space-x-1 backdrop-blur-xl transition-all ${
              darkMode ? 'bg-zinc-900/60 border-white/5' : 'bg-slate-100/80 border-slate-205 shadow-sm'
            }`}>
              <button
                onClick={() => setActiveMainTab('Eventos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
                  activeMainTab === 'Eventos' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                    : darkMode 
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-805/60' 
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-slate-200/50'
                }`}
              >
                Eventos
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => setActiveMainTab('Painel Admin')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 hover:scale-[1.02] active:scale-95 cursor-pointer ${
                    activeMainTab === 'Painel Admin' 
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25' 
                      : darkMode 
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-805/60' 
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-slate-200/50'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Painel Admin</span>
                </button>
              )}
            </div>
          </div>

          {/* Sliding Pill Switcher for views (Apple style) */}
          {activeMainTab === 'Eventos' ? (
            <div className={`hidden md:flex p-1 rounded-2xl border relative w-[420px] ${
              darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-slate-200/40 border-slate-200/50'
            }`}>
              <div 
                className="absolute top-1 bottom-1 left-1 rounded-xl bg-white dark:bg-zinc-800 shadow-md transition-transform duration-[450ms]"
                style={{
                  width: 'calc(25% - 2px)',
                  transform: `translateX(${activeViewIndex * 100}%)`,
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
              
              {viewOptions.map((view) => {
                const Icon = view.icon;
                const active = currentView === view.id;
                return (
                  <button
                    key={view.id}
                    onClick={() => setCurrentView(view.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 relative z-10 ${
                      active 
                        ? 'text-zinc-950 dark:text-white' 
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 stroke-[1.8]" />
                    <span>{view.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="w-[420px] hidden md:block" />
          )}

          {/* Theme, Register actions */}
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => signOut(auth)}
              className={`p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.03] active:scale-95 ${
                darkMode 
                  ? 'bg-zinc-900/60 border-white/5 text-rose-400 hover:border-zinc-700' 
                  : 'bg-white border-slate-200/80 text-rose-600 hover:bg-slate-100'
              }`}
              title="Sair"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.03] active:scale-95 ${
                darkMode 
                  ? 'bg-zinc-900/60 border-white/5 text-amber-400 hover:border-zinc-700' 
                  : 'bg-white border-slate-200/80 text-zinc-600 hover:bg-slate-100'
              }`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={exportToICS}
              className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 px-5 py-3 rounded-2xl text-xs font-bold shadow-sm transition-all duration-300 border border-slate-200 dark:border-white/5 font-sans"
            >
              <Calendar className="h-4 w-4 stroke-[2.5]" />
              <span className="tracking-wide">Exportar Calendário</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center space-x-2 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 px-5 py-3 rounded-2xl text-xs font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-white/10 dark:border-transparent font-sans"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span className="tracking-wide">Novo Evento</span>
            </button>
          </div>

        </div>
      </header>



      {activeMainTab === 'Eventos' && (
        <>
          {/* Main Workspace Filter Hub */}
      <section className="w-full px-6 lg:px-12 xl:px-16 pt-6 pb-4 relative z-10">
        
        {/* Mobile View Switcher */}
        <div className={`flex md:hidden mb-4 p-1 rounded-2xl border relative ${
          darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-slate-200/35 border-slate-200/60'
        }`}>
          <div 
            className="absolute top-1 bottom-1 left-1 rounded-xl bg-white dark:bg-zinc-800 shadow-md transition-transform duration-[450ms]"
            style={{
              width: 'calc(25% - 2px)',
              transform: `translateX(${activeViewIndex * 100}%)`,
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          />
          {viewOptions.map((view) => {
            const Icon = view.icon;
            const active = currentView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-[10px] font-bold tracking-wide transition-all duration-300 relative z-10 ${
                  active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {/* Primary Filter and Classification Row */}
        <div className="flex flex-col gap-3 pb-4 border-b border-slate-200/40 dark:border-white/5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Search Input Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-35 dark:opacity-50 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por pautas, responsáveis, locais ou feriados..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-[11px] font-medium tracking-wide outline-none transition-all duration-300 ${
                  darkMode 
                    ? 'bg-zinc-900/35 border-white/5 text-white focus:border-indigo-500 focus:bg-zinc-905' 
                    : 'bg-white border-slate-200 text-zinc-800 focus:border-indigo-500'
                }`}
              />
            </div>

            {/* Toggle Actions Group (Corporate/Holidays & Past Toggle & Advanced Filters) */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Past Events Toggle Button */}
              <button
                onClick={() => {
                  setShowPast(!showPast);
                  showToast(!showPast ? "Histórico de pautas anteriores ativado." : "Exibindo apenas pautas futuras.");
                }}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  showPast
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : darkMode
                      ? 'bg-zinc-900/50 border-white/5 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      : 'bg-white border-slate-200 text-zinc-600 hover:bg-slate-100'
                }`}
              >
                <History className={`h-3.5 w-3.5 transition-transform duration-300 ${showPast ? 'rotate-[-45deg]' : ''}`} />
                <span>{showPast ? "Ocultar Anteriores" : "Ver Anteriores"}</span>
              </button>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  showAdvancedFilters || selectedCategory !== 'Todos' || selectedStatus !== 'Todos' || selectedFormat !== 'Todos' || selectedResponsible !== 'Todos'
                    ? 'bg-zinc-800 border-zinc-700 text-white dark:bg-zinc-105 dark:border-slate-300 dark:text-zinc-900'
                    : darkMode
                      ? 'bg-zinc-900/50 border-white/5 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      : 'bg-white border-slate-200 text-zinc-600 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filtros</span>
                {(selectedCategory !== 'Todos' || selectedStatus !== 'Todos' || selectedFormat !== 'Todos' || selectedResponsible !== 'Todos') && (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 ml-0.5 animate-pulse"></span>
                )}
              </button>

            </div>

          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2 pt-4 border-t border-slate-200/40 dark:border-white/5 transition-all animate-[spring-in_0.35s_ease-out]">
              
              {/* Category Filter */}
              <div className="flex flex-col space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Categoria</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-[11px] font-semibold outline-none transition-all ${
                    darkMode ? 'bg-zinc-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-zinc-700 focus:border-indigo-505'
                  }`}
                >
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Status</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-[11px] font-semibold outline-none transition-all ${
                    darkMode ? 'bg-zinc-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-zinc-700 focus:border-indigo-505'
                  }`}
                >
                  {uniqueStatuses.map(st => (
                    <option key={st} value={st}>{st === 'Todos' ? 'Todos' : st.charAt(0).toUpperCase() + st.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Format Filter */}
              <div className="flex flex-col space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Formato</span>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-[11px] font-semibold outline-none transition-all ${
                    darkMode ? 'bg-zinc-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-zinc-700 focus:border-indigo-505'
                  }`}
                >
                  {uniqueFormats.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Responsible/Host Filter */}
              <div className="flex flex-col space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Responsável</span>
                <select
                  value={selectedResponsible}
                  onChange={(e) => setSelectedResponsible(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-[11px] font-semibold outline-none transition-all ${
                    darkMode ? 'bg-zinc-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-zinc-700 focus:border-indigo-505'
                  }`}
                >
                  {uniqueResponsibles.map(resp => <option key={resp} value={resp}>{resp}</option>)}
                </select>
              </div>

            </div>
          )}

        </div>

        {/* Dynamic Nav Controls for Cal / Monthly View */}
        {(currentView === 'monthly' || currentView === 'weekly') && (
          <div className="mt-4 flex items-center justify-between transition-all">
            <button
              onClick={() => setCurrentDate(new Date())}
              className={`px-4 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${
                darkMode ? 'bg-zinc-900/60 border-white/5 hover:border-zinc-700' : 'bg-white border-slate-200 hover:bg-slate-100'
              }`}
            >
              Hoje
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevDate}
                className={`p-2.5 rounded-xl border transition-all ${
                  darkMode ? 'bg-zinc-900/60 border-white/5 hover:border-zinc-700' : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold font-display px-2 uppercase tracking-wide">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={handleNextDate}
                className={`p-2.5 rounded-xl border transition-all ${
                  darkMode ? 'bg-zinc-900/60 border-white/5 hover:border-zinc-700' : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Main Container */}
      <main className="w-full px-6 lg:px-12 xl:px-16 pb-24 relative z-10">

        {/* Database Error / Seeding / Empty States */}
        {dbError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-3xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900 flex items-center justify-center mb-5 shadow-inner">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-base font-bold font-display tracking-tight text-red-600 dark:text-red-400">Erro no Banco de Dados</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-sm font-normal leading-relaxed">
              {dbError}
            </p>
          </div>
        ) : seeding || (filteredEvents.length === 0 && events.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-5"></div>
            <h3 className="text-base font-bold font-display tracking-tight text-slate-800 dark:text-zinc-200">Carregando painel do servidor...</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Buscando calendários no hub corporativo.
            </p>
          </div>
        ) : filteredEvents.length === 0 && events.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-3xl bg-zinc-100 dark:bg-zinc-900/60 border border-slate-205 dark:border-white/5 flex items-center justify-center mb-5 shadow-inner animate-bounce">
              <Info className="h-5 w-5 opacity-45 text-indigo-500" />
            </div>
            <h3 className="text-base font-bold font-display tracking-tight">Nenhum registro localizado</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1.5 max-w-sm font-normal leading-relaxed">
              {!showPast ? "Nenhum evento neste período. No painel de navegação, ative a opção 'Ver Anteriores' para vizualizar eventos do passado." : "Não encontramos eventos ou feriados com estes termos ativos. Mude seus seletores ou crie um novo evento interno."}
            </p>
          </div>
        ) : null}

        {/* Cards View Layout */}
        {currentView === 'cards' && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {filteredEvents.map((event) => {
              const IconComponent = event.icon || MapPin;
              const isSaved = savedEventIds.includes(event.id);
              const isHoli = event.isHoliday;
              
              const monthName = event.date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
              const dayNum = event.date.getDate();

              const FormatIcon = event.format && (FORMAT_STYLES as any)[event.format] ? (FORMAT_STYLES as any)[event.format].icon : Monitor;

              // Calculate happening now and upcoming 7 days statuses
              const now = new Date();
              const eventDateObj = event.date instanceof Date ? event.date : new Date(event.date);
              
              const eventEndDateObj = event.endDate 
                ? (event.endDate instanceof Date ? event.endDate : new Date(event.endDate))
                : new Date(eventDateObj.getTime() + 2 * 60 * 60 * 1000); // 2h duration fallback
                
              const isHappeningNow = isHoli
                ? (now.toDateString() === eventDateObj.toDateString())
                : (now >= eventDateObj && now <= eventEndDateObj);
                
              // Calendar days difference
              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const eventStart = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate());
              const diffTime = eventStart.getTime() - todayStart.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`group relative flex flex-col rounded-[24px] overflow-hidden cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.02] border ${
                    darkMode 
                      ? 'bg-zinc-900/40 border-white/10 shadow-xl shadow-black/40 hover:shadow-2xl hover:bg-zinc-900/50 backdrop-blur-2xl' 
                      : 'bg-white/60 border-slate-200 shadow-lg shadow-black/5 hover:shadow-xl hover:bg-white/85 backdrop-blur-2xl'
                  }`}
                >
                  {/* Banner Image Container */}
                  <div className="relative w-full h-40 overflow-hidden z-0 pointer-events-none">
                    <img 
                       src={event.imageUrl || `https://picsum.photos/seed/${event.id || event.title}/400/200`} 
                       alt={event.title} 
                       className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                    />
                    {/* Linear gradient fade overlay on image top/bottom to make floating badges readable */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Bookmark Floating Action */}
                  {!isHoli && (
                    <button
                      onClick={(e) => handleToggleBookmark(event.id, e)}
                      className="absolute top-3.5 right-3.5 h-8.5 w-8.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/40 hover:scale-110 transition-all z-20 shadow-md"
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-white text-white' : 'text-white/90'}`} />
                    </button>
                  )}

                  {/* Meta Category label */}
                  <span className={`absolute top-3.5 left-3.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm z-20 ${
                    isHoli ? 'bg-amber-500/80 text-white' : 'bg-black/40 text-white/95'
                  }`}>
                    {event.category}
                  </span>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-grow relative z-10 bg-transparent">
                    
                    {/* Date and Format Info - now below the image with full readability */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-display tracking-wide text-zinc-500 dark:text-zinc-400 mb-3 border-b border-slate-200/40 dark:border-white/5 pb-2.5">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="font-bold">{dayNum} {monthName}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="font-bold">{isHoli ? 'Dia Todo' : formatTime(event.date)}</span>
                      </div>

                      {isHappeningNow && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-455 border border-rose-500/20 animate-pulse flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                          Acontecendo agora
                        </span>
                      )}

                      {!isHappeningNow && diffDays > 0 && diffDays <= 7 && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/30 dark:border-indigo-800/40">
                          Em {diffDays} {diffDays === 1 ? 'dia' : 'dias'}
                        </span>
                      )}

                      {!isHoli && event.format && (FORMAT_STYLES as any)[event.format] && (
                        <div className="flex items-center gap-1">
                          <FormatIcon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span className="uppercase text-[9px] font-normal">{event.format}</span>
                        </div>
                      )}

                      {!isHoli && event.status && (STATUS_STYLES as any)[event.status] && (
                        <div className="flex items-center gap-1 ml-auto">
                          <span className={`h-1.5 w-1.5 rounded-full ${(STATUS_STYLES as any)[event.status].dot}`} />
                          <span className="uppercase text-[8px] font-normal text-zinc-400 dark:text-zinc-550">{(STATUS_STYLES as any)[event.status].label}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-bold tracking-tight font-display text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors duration-200 break-words line-clamp-2">
                      {event.title}
                    </h3>
                    
                    <p className="text-xs mt-2 leading-relaxed text-zinc-550 dark:text-zinc-400 font-normal line-clamp-2">
                      {event.description}
                    </p>

                    {/* Host/Responsible Display */}
                    {event.host && !isHoli && (
                      <p className="text-[10px] mt-2.5 text-zinc-455 dark:text-zinc-500 font-medium">
                        Responsável: <span className="font-semibold text-zinc-650 dark:text-zinc-350">{event.host}</span>
                      </p>
                    )}

                    {/* Card Footer Integration */}
                    <div className="mt-auto pt-4 border-t border-slate-200/40 dark:border-white/5 space-y-2.5">
                      {/* Location Row */}
                      {event.location && (
                        <div className="flex items-start space-x-1.5 text-[11px] text-zinc-500 dark:text-zinc-450 font-semibold leading-normal">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="break-words w-full" title={event.location}>{event.location}</span>
                        </div>
                      )}
                      
                      {/* Avatars and Details Action */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-medium">
                          <AvatarStack members={event.techTeam} max={3} isHoliday={isHoli} scope={event.scope} />
                          {!isHoli && event.techTeam && event.techTeam.length > 0 && (
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1 font-mono">
                              Staff ({event.techTeam.length})
                            </span>
                          )}
                        </div>
                        
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase flex items-center gap-1 shrink-0 group-hover:translate-x-1 transition-transform duration-300">
                          Detalhes <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

          {/* Timeline View Layout */}
        {currentView === 'timeline' && filteredEvents.length > 0 && (() => {
          // Grouping logic:
          const groupedEvents: { [key: string]: typeof filteredEvents } = {};
          filteredEvents.forEach(event => {
            const dateObj = event.date instanceof Date ? event.date : new Date(event.date);
            const month = dateObj.toLocaleDateString('pt-BR', { month: 'long' });
            const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
            const key = `${capitalizedMonth} ${dateObj.getFullYear()}`;
            if (!groupedEvents[key]) {
              groupedEvents[key] = [];
            }
            groupedEvents[key].push(event);
          });

          // Themes mapping for each event category to create dynamic neon/glow border styling
          const timelineCategoryThemes: {
            [key: string]: {
              borderActive: string;
              glowColor: string;
              textColor: string;
              dotColor: string;
              gradient: string;
            }
          } = {
            'Comercial Interno': {
              borderActive: 'border-indigo-500/50 dark:border-indigo-400/45',
              glowColor: '0, 160, 255',
              textColor: 'text-indigo-500 dark:text-indigo-400',
              dotColor: 'bg-indigo-500 dark:bg-indigo-400',
              gradient: 'from-indigo-500 to-indigo-400',
            },
            'Comercial Patrocinado': {
              borderActive: 'border-violet-500/50 dark:border-violet-400/45',
              glowColor: '139, 92, 246',
              textColor: 'text-violet-500 dark:text-violet-400',
              dotColor: 'bg-violet-500 dark:bg-violet-400',
              gradient: 'from-violet-500 to-violet-400',
            },
            'Evento Interno': {
              borderActive: 'border-emerald-500/50 dark:border-emerald-400/45',
              glowColor: '16, 185, 129',
              textColor: 'text-emerald-500 dark:text-emerald-400',
              dotColor: 'bg-emerald-500 dark:bg-emerald-400',
              gradient: 'from-emerald-500 to-emerald-400',
            },
            'Feriado': {
              borderActive: 'border-amber-500/50 dark:border-amber-400/45',
              glowColor: '245, 158, 11',
              textColor: 'text-amber-500 dark:text-amber-400',
              dotColor: 'bg-amber-500 dark:bg-amber-400',
              gradient: 'from-amber-500 to-amber-400',
            }
          };

          const fallbackTheme = {
            borderActive: 'border-zinc-500/50 dark:border-zinc-400/45',
            glowColor: '109, 127, 177',
            textColor: 'text-zinc-500 dark:text-zinc-400',
            dotColor: 'bg-zinc-500 dark:bg-zinc-400',
            gradient: 'from-zinc-500 to-zinc-400',
          };

          return (
            <div className="relative max-w-6xl mx-auto pl-4 sm:pl-10 animate-fade-in-up">
              {/* Background pipeline */}
              <div className={`absolute left-8 sm:left-48 top-2 bottom-2 w-[2px] ${
                darkMode ? 'bg-zinc-800/40' : 'bg-slate-200/70'
              }`} />

              <div className="space-y-12">
                {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
                  <div key={monthYear} className="space-y-8 relative">
                    
                    {/* Month Header Row */}
                    <div className="relative flex items-center gap-4 pt-4 pb-2">
                      <div className="absolute left-4 sm:left-[152px] -translate-x-1/2 w-4 border-t border-slate-200 dark:border-white/10" />
                      <div className="pl-10 sm:pl-52">
                        <h2 className="text-[10px] font-bold tracking-widest text-zinc-800 dark:text-zinc-200 uppercase font-mono bg-zinc-100/90 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-200/80 dark:border-white/5 inline-flex items-center gap-2.5 shadow-sm transition-all duration-300 hover:border-indigo-500/30">
                          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{monthYear}</span>
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold normal-case">
                            ({monthEvents.length} {monthEvents.length === 1 ? 'evento' : 'eventos'})
                          </span>
                        </h2>
                      </div>
                    </div>

                    {/* Month's Events */}
                    <div className="space-y-8">
                      {monthEvents.map((event) => {
                        const dateObj = event.date instanceof Date ? event.date : new Date(event.date);
                        const dayNum = dateObj.getDate();
                        const isHoli = event.isHoliday;
                        const catStyle = (CATEGORY_STYLES as any)[event.category] || { badge: 'bg-zinc-100', dot: 'bg-zinc-400' };
                        const theme = timelineCategoryThemes[event.category] || fallbackTheme;
                        const isHovered = hoveredEventId === event.id;

                        // Choose format icon for nodes
                        const FormatIcon = event.isHoliday 
                          ? Calendar 
                          : (event.format && (FORMAT_STYLES as any)[event.format] 
                              ? (FORMAT_STYLES as any)[event.format].icon 
                              : Monitor);

                        const shadowGlowStyle = isHovered 
                          ? {
                              boxShadow: `0 20px 40px -15px rgba(${theme.glowColor}, 0.12), 0 0 20px -2px rgba(${theme.glowColor}, 0.05)`,
                            }
                          : {};

                        return (
                          <div 
                            key={event.id} 
                            className="relative flex flex-col sm:flex-row gap-6 sm:gap-20 group"
                            onMouseEnter={() => setHoveredEventId(event.id)}
                            onMouseLeave={() => setHoveredEventId(null)}
                          >
                            {/* Active Line Highlight Overlay */}
                            <div className={`absolute left-4 sm:left-[152px] -translate-x-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b ${theme.gradient} transition-all duration-500 ${
                              isHovered ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-75 pointer-events-none'
                            } origin-top`} />

                            {/* Circle Node */}
                            <div className="absolute left-4 sm:left-[152px] -translate-x-1/2 top-5 z-10">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-md ${
                                isHovered
                                  ? `bg-white dark:bg-zinc-900 ${theme.borderActive} scale-125 shadow-lg`
                                  : darkMode 
                                    ? 'bg-zinc-950 border-white/5 hover:border-indigo-500' 
                                    : 'bg-white border-slate-200 hover:border-indigo-500'
                              }`}>
                                {isHovered ? (
                                  <FormatIcon className={`h-4.5 w-4.5 ${theme.textColor} animate-pulse`} />
                                ) : (
                                  <div className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${catStyle.dot || theme.dotColor}`} />
                                )}
                              </div>
                            </div>

                            {/* Date Block (Left Column) */}
                            <div className="pl-12 sm:pl-0 sm:w-28 pt-1 flex-shrink-0 text-left sm:text-right mt-1 sm:mt-0 flex flex-col items-start sm:items-end gap-1 select-none">
                              <span className={`text-4xl sm:text-5xl font-black font-display tracking-tighter leading-none transition-all duration-500 ${
                                isHovered 
                                  ? theme.textColor 
                                  : 'text-zinc-300 dark:text-zinc-800'
                              }`}>
                                {String(dayNum).padStart(2, '0')}
                              </span>
                              <div className="flex flex-col items-start sm:items-end font-display">
                                <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${
                                  isHovered ? theme.textColor : 'text-zinc-500 dark:text-zinc-400'
                                }`}>
                                  {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                                </span>
                                <span className="text-[9px] font-medium tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                                  {dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                </span>
                              </div>
                              <div className="mt-2 font-display">
                                {isHoli ? (
                                  <span className="text-[9px] font-bold tracking-wider uppercase bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" /> Dia Todo
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold tracking-wider uppercase bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-white/5 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 text-indigo-500" /> {formatTime(dateObj)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Glass Container Card (Right Column) */}
                            <div
                              onClick={() => setSelectedEvent(event)}
                              className={`flex-1 p-6 sm:p-7 rounded-[24px] border cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                                isHovered 
                                  ? `scale-[1.015] ${theme.borderActive}` 
                                  : 'scale-100 border-slate-200/60 dark:border-white/5'
                              } ${
                                isHoli
                                  ? darkMode ? 'bg-zinc-900/20 hover:bg-zinc-900/30' : 'bg-slate-50/50 hover:bg-slate-50/85'
                                  : darkMode 
                                    ? 'bg-zinc-900/30 backdrop-blur-md hover:bg-zinc-900/50 shadow-xl shadow-black/10' 
                                    : 'bg-white/50 backdrop-blur-md hover:bg-white/85 shadow-sm shadow-slate-100/50'
                              }`}
                              style={shadowGlowStyle}
                            >
                              {/* Card Header Tags */}
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${catStyle.badge}`}>
                                    {event.category}
                                  </span>
                                  {!isHoli && event.status && (STATUS_STYLES as any)[event.status] && (
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${(STATUS_STYLES as any)[event.status].badge}`}>
                                      {(STATUS_STYLES as any)[event.status].label}
                                    </span>
                                  )}
                                  {!isHoli && event.format && (FORMAT_STYLES as any)[event.format] && (
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${(FORMAT_STYLES as any)[event.format].badge}`}>
                                      <FormatIcon className="h-3 w-3 mr-1 inline text-indigo-500" />
                                      {event.format}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1.5 text-[11px] text-zinc-550 dark:text-zinc-400 font-medium">
                                  <AvatarStack members={event.techTeam} max={3} isHoliday={isHoli} scope={event.scope} />
                                </div>
                              </div>

                              {/* Title */}
                              <h3 className={`text-base sm:text-lg font-bold tracking-tight font-display transition-colors duration-300 break-words ${
                                isHovered 
                                  ? `${theme.textColor}`
                                  : 'text-zinc-900 dark:text-white'
                              }`}>
                                {event.title}
                              </h3>
                              
                              {/* Description */}
                              <p className="text-xs mt-2.5 leading-relaxed text-zinc-550 dark:text-zinc-400 font-normal">
                                {event.description}
                              </p>

                              {/* Host */}
                              {event.host && !isHoli && (
                                <p className="text-[10px] mt-2.5 text-zinc-400 dark:text-zinc-500 font-medium">
                                  Responsável: <span className="font-semibold text-zinc-650 dark:text-zinc-350">{event.host}</span>
                                </p>
                              )}

                              {/* Footer Details */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-200/40 dark:border-white/5">
                                <div className="flex items-center text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-normal">
                                  <MapPin className="h-3.5 w-3.5 mr-1.5 text-rose-500 shrink-0 stroke-[1.8]" />
                                  <span className="break-words w-full" title={event.location}>{event.location}</span>
                                </div>
                                <span className={`text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 shrink-0 transition-all duration-300 ${
                                  isHovered 
                                    ? `${theme.textColor} translate-x-1` 
                                    : 'text-indigo-600 dark:text-indigo-400'
                                }`}>
                                  Detalhes <ArrowUpRight className="h-3.5 w-3.5" />
                                </span>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Monthly Calendar View Layout */}
        {currentView === 'monthly' && (
          <div className={`rounded-[28px] border overflow-hidden shadow-xl transition-colors border-slate-205 dark:border-white/5 backdrop-blur-xl ${
            darkMode ? 'bg-zinc-900/15' : 'bg-white'
          }`}>
            {/* Days header row */}
            <div className={`grid grid-cols-7 text-center py-4 border-b text-[10px] font-bold tracking-[0.12em] uppercase ${
              darkMode ? 'bg-zinc-950/40 border-white/5 text-zinc-400' : 'bg-slate-100 border-slate-200/60 text-zinc-600'
            }`}>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Calendar dynamic grid */}
            <div className={`grid grid-cols-7 divide-x divide-y divide-dashed ${
              darkMode 
                ? 'divide-zinc-800/60 border-t border-white/5' 
                : 'divide-slate-200 border-t border-slate-200/60'
            }`}>
              {getDaysInMonth(currentDate).map((dayObj, index) => {
                const dayEvents = filteredEvents.filter(e => 
                  e.date.getDate() === dayObj.date.getDate() &&
                  e.date.getMonth() === dayObj.date.getMonth() &&
                  e.date.getFullYear() === dayObj.date.getFullYear()
                );

                const isToday = new Date().toDateString() === dayObj.date.toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[130px] p-3 flex flex-col justify-between transition-colors duration-150 relative ${
                      !dayObj.isCurrentMonth ? 'opacity-[0.25] bg-zinc-900/5 dark:bg-zinc-900/5' : ''
                    } ${
                      isToday ? 'bg-indigo-500/5 dark:bg-indigo-500/10' : ''
                    }`}
                  >
                    {/* Day number cell wrapper */}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-bold h-6.5 w-6.5 rounded-lg flex items-center justify-center font-display ${
                        isToday 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/35 scale-105' 
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}>
                        {dayObj.date.getDate()}
                      </span>
                      {isToday && (
                        <span className="absolute top-3 right-3 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                      )}
                    </div>

                    {/* Day elements mapped */}
                    <div className="flex-1 flex flex-col justify-end space-y-1.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`text-[9.5px] font-semibold px-2 py-1 rounded-lg border truncate cursor-pointer transition-all duration-200 hover:scale-[1.02] border-l-[3.5px] ${
                            event.isHoliday
                              ? 'bg-slate-100/90 dark:bg-zinc-800/50 border-zinc-400 text-zinc-600 dark:text-zinc-300'
                              : darkMode 
                                ? 'bg-zinc-900/60 border-white/5 text-zinc-300 hover:bg-zinc-800' 
                                : 'bg-slate-50 border-slate-200 text-zinc-700 hover:bg-slate-100'
                          }`}
                          style={event.isHoliday ? {} : { borderLeftColor: `var(--tw-gradient-from)` }}
                          title={`${event.title} (${event.category})`}
                        >
                          <span className="opacity-70 font-display">{event.isHoliday ? 'FERIADO' : formatTime(event.date)}</span> • {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-center font-bold text-indigo-500 mt-1 uppercase tracking-wider">
                          + {dayEvents.length - 3} itens
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly View Layout */}
        {currentView === 'weekly' && (
          <div className={`rounded-[28px] border overflow-hidden shadow-xl transition-colors border-slate-200/60 dark:border-white/5 backdrop-blur-xl ${
            darkMode ? 'bg-zinc-900/15' : 'bg-white'
          }`}>
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                
                {/* Header days mapping */}
                <div className={`grid grid-cols-8 divide-x border-b ${
                  darkMode ? 'divide-white/5 border-white/5' : 'divide-slate-200 border-slate-205'
                }`}>
                  <div className={`p-4.5 text-center text-[10px] font-bold tracking-widest uppercase opacity-45 flex items-center justify-center ${
                    darkMode ? 'bg-zinc-950/40 text-zinc-400' : 'bg-slate-50 text-zinc-650'
                  }`}>
                    Expediente
                  </div>

                  {getDaysInWeek(currentDate).map((day, idx) => {
                    const isToday = new Date().toDateString() === day.toDateString();
                    return (
                      <div
                        key={idx}
                        className={`p-4 text-center flex flex-col items-center justify-center relative ${
                          isToday ? 'bg-indigo-500/5 dark:bg-indigo-500/10' : darkMode ? 'bg-zinc-950/20' : 'bg-slate-50/20'
                        }`}
                      >
                        <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-400 dark:text-zinc-500 font-display">
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </span>
                        <span className={`text-sm font-bold mt-1 h-7 w-7 rounded-lg flex items-center justify-center font-display ${
                          isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/35 scale-105' : ''
                        }`}>
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Grid schedule hours row */}
                <div className="divide-y divide-dashed divide-slate-200 dark:divide-white/5">
                  {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((timeStr) => {
                    const hourVal = parseInt(timeStr.split(':')[0]);
                    
                    return (
                      <div
                        key={timeStr}
                        className={`grid grid-cols-8 divide-x divide-dashed ${
                          darkMode ? 'divide-white/5' : 'divide-slate-205'
                        }`}
                      >
                        {/* Time Left Badge */}
                        <div className="p-4 text-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-500 flex items-center justify-center bg-slate-100/30 dark:bg-zinc-900/10">
                          {timeStr}
                        </div>

                        {/* Schedule entries */}
                        {getDaysInWeek(currentDate).map((dayDate, dayIdx) => {
                          const hourEvents = filteredEvents.filter(e => {
                            const sameDay = e.date.getDate() === dayDate.getDate() &&
                                            e.date.getMonth() === dayDate.getMonth() &&
                                            e.date.getFullYear() === dayDate.getFullYear();
                            if (!sameDay) return false;
                            
                            if (e.isHoliday) {
                              return hourVal === 8; 
                            }
                            const eventHour = e.date.getHours();
                            return eventHour >= hourVal && eventHour < hourVal + 2;
                          });

                          return (
                            <div
                              key={dayIdx}
                              className="p-2 min-h-[105px] relative flex flex-col gap-1.5 justify-center bg-transparent hover:bg-indigo-500/[0.01]"
                            >
                              {hourEvents.map(event => (
                                <div
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className={`text-[9.5px] p-2.5 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all duration-350 flex flex-col justify-between ${
                                    event.isHoliday
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                                      : darkMode 
                                        ? 'bg-zinc-900/50 border-white/5 hover:border-zinc-700 text-zinc-100' 
                                        : 'bg-white border-slate-200 hover:border-slate-300 text-zinc-805 shadow-sm'
                                  }`}
                                  style={event.isHoliday ? {} : { borderLeft: `3px solid var(--tw-gradient-from)` }}
                                >
                                  <div className="font-bold truncate text-zinc-900 dark:text-zinc-100 leading-snug">
                                    {event.isHoliday ? `[FERIADO] ${event.title}` : event.title}
                                  </div>
                                  <div className="flex items-center justify-between mt-2.5">
                                    <div className="text-[9px] text-zinc-400 font-medium flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{event.isHoliday ? 'Dia Todo' : formatTime(event.date)}</span>
                                    </div>
                                    <AvatarStack members={event.techTeam} max={2} isHoliday={event.isHoliday} scope={event.scope} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* Detailed Modal Popup Overlay */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Frosted dark backdrop overlay */}
          <div 
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setSelectedEvent(null)}
          />

          {/* Modal Container Structure - Neo-Noir Glass Panel */}
          <div className={`relative w-full max-w-4xl max-h-[calc(100vh-2rem)] flex flex-col rounded-[40px] overflow-hidden shadow-3xl border transform transition-all animate-spring-in z-30 ${
            darkMode 
              ? 'bg-zinc-950/80 border-white/10 text-white' 
              : 'bg-white/90 border-slate-200 text-zinc-900'
          }`}
          style={{
            backdropFilter: 'blur(30px) saturate(190%)',
          }}>
            
            {/* Texture Noise Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.015] z-0" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              }}
            />

            {/* Full-Bleed Cover Header */}
            <div className="h-48 relative overflow-hidden bg-zinc-900 border-b border-white/5 shrink-0">
              <img 
                 src={selectedEvent.imageUrl || `https://picsum.photos/seed/${selectedEvent.id || selectedEvent.title}/400/200`} 
                 alt={selectedEvent.title} 
                 className="absolute inset-0 w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-700 opacity-80" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent z-10" />
              
              {/* Floating Close Action Button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-5 right-5 h-9 w-9 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-black/60 hover:scale-105 transition-all duration-200 z-50 cursor-pointer"
              >
                <X className="h-4.5 w-4.5 stroke-[2.2]" />
              </button>
            </div>

            {/* Overlapping Typography Floating Card */}
            <div className="relative px-8 -mt-10 z-20 shrink-0">
              <div className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all ${
                darkMode 
                  ? 'bg-zinc-900/90 border-white/10 text-white shadow-black/60' 
                  : 'bg-white/95 border-slate-200 text-zinc-900 shadow-slate-350/50'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black tracking-widest uppercase bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded-lg">
                        {selectedEvent.category}
                      </span>
                      {selectedEvent.format && (
                        <span className="text-[8px] font-black tracking-widest uppercase bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-lg">
                          {selectedEvent.format}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight leading-snug">
                      {selectedEvent.title}
                    </h2>
                  </div>

                  {/* Quick Metrics Overlay */}
                  <div className="flex items-center gap-6 text-[10px] text-zinc-400 font-semibold tracking-wider uppercase border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-white/5 pt-4 md:pt-0 md:pl-6 shrink-0">
                    <div className="min-w-max shrink-0">
                      <span className="block text-zinc-500 text-[8px]">Início</span>
                      <span className="text-xs text-zinc-805 dark:text-white font-bold block mt-1">{formatTime(selectedEvent.date)}</span>
                    </div>
                    <div className="min-w-max shrink-0">
                      <span className="block text-zinc-500 text-[8px]">Fim</span>
                      <span className="text-xs text-zinc-805 dark:text-white font-bold block mt-1">{formatTime(selectedEvent.endDate)}</span>
                    </div>
                    <div className="min-w-max shrink-0">
                      <span className="block text-zinc-500 text-[8px]">Responsável</span>
                      <span className="text-xs text-indigo-650 dark:text-indigo-400 font-bold block mt-1">{selectedEvent.host || '--'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* In-depth contextual panel details */}
            <div className="px-8 pb-8 pt-4 space-y-7 flex-1 overflow-y-auto custom-scrollbar relative z-10">
              
              {/* Event Progress & Status Board */}
              {!selectedEvent.isHoliday && selectedEvent.status && (STATUS_STYLES as any)[selectedEvent.status] && (
                <div className={`p-5 rounded-2xl border ${
                  darkMode ? 'bg-zinc-950/40 border-white/5' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">Progresso do Evento</span>
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase border ${(STATUS_STYLES as any)[selectedEvent.status].badge}`}>
                      {(STATUS_STYLES as any)[selectedEvent.status].label}
                    </span>
                  </div>
                  
                  {/* Sliding scale progress */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
                      style={{
                        width: selectedEvent.status === 'em negociação' ? '25%' : 
                               selectedEvent.status === 'planejado' ? '50%' : 
                               selectedEvent.status === 'confirmado' ? '75%' : '100%'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold mt-2 uppercase tracking-wider">
                    <span>Negociação</span>
                    <span>Planejado</span>
                    <span>Confirmado</span>
                    <span>Concluído</span>
                  </div>
                </div>
              )}

              {/* Compact Dynamic Badge Metadata Row */}
              <div className="flex flex-wrap gap-2.5 items-center text-xs font-semibold relative z-10">
                
                {/* Date & Time Badge */}
                <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl border transition-all ${
                  darkMode ? 'bg-zinc-950/40 border-white/5 text-zinc-350' : 'bg-slate-50 border-slate-200 text-zinc-650'
                }`}>
                  <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>{formatDateLong(selectedEvent.date)}</span>
                  <span className="opacity-30">|</span>
                  <span className="text-[10px] font-normal">
                    {selectedEvent.isHoliday ? 'Dia Inteiro' : `${formatTime(selectedEvent.date)} - ${formatTime(selectedEvent.endDate)}`}
                  </span>
                </div>

                {/* Location & Format Badge */}
                {selectedEvent.location && selectedEvent.location !== '--' && selectedEvent.location.trim() !== '' && (
                  <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl border transition-all ${
                    darkMode ? 'bg-zinc-950/40 border-white/5 text-zinc-350' : 'bg-slate-50 border-slate-200 text-zinc-655'
                  }`}>
                    <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span className="truncate max-w-[220px]" title={selectedEvent.location}>{selectedEvent.location}</span>
                    {selectedEvent.format && (
                      <>
                        <span className="opacity-30">|</span>
                        <span className="text-[10px] font-normal opacity-75">{selectedEvent.format}</span>
                      </>
                    )}
                  </div>
                )}

                {/* Responsible Areas Badge */}
                {selectedEvent.responsibleAreas && selectedEvent.responsibleAreas.length > 0 && (
                  <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl border transition-all ${
                    darkMode ? 'bg-zinc-950/40 border-white/5 text-zinc-350' : 'bg-slate-50 border-slate-200 text-zinc-655'
                  }`}>
                    <Users className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Áreas: {selectedEvent.responsibleAreas.join(', ')}</span>
                  </div>
                )}

                {/* Attendees Counts Badge (only if non-holiday and has counts) */}
                {!selectedEvent.isHoliday && (Number(selectedEvent.staffCount) > 0 || Number(selectedEvent.clientCount) > 0 || Number(selectedEvent.vipCount) > 0) && (
                  <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl border transition-all ${
                    darkMode ? 'bg-zinc-950/40 border-white/5 text-zinc-350' : 'bg-slate-50 border-slate-200 text-zinc-655'
                  }`}>
                    <Heart className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Público: {selectedEvent.staffCount || 0} Staff / {selectedEvent.clientCount || 0} Cli / {selectedEvent.vipCount || 0} VIP</span>
                  </div>
                )}

                {/* Holiday Badge */}
                {selectedEvent.isHoliday && (
                  <div className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>Recesso Corporativo</span>
                  </div>
                )}

              </div>
              
              {/* Extra Details Data block */}
              {(!selectedEvent.isHoliday) && (
                <>
                  <div className={`grid gap-6 ${
                  ((selectedEvent.techTeam && selectedEvent.techTeam.length > 0) ||
                   (selectedEvent.clientList && selectedEvent.clientList.length > 0) ||
                   (selectedEvent.vipList && selectedEvent.vipList.length > 0) ||
                   (selectedEvent.brindes_alocados && selectedEvent.brindes_alocados.length > 0))
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1'
                }`}>
                  
                  {/* Left Column: Context & Details */}
                  <div className="space-y-6">
                    {selectedEvent.description && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-indigo-500 mb-2 flex items-center gap-1.5 font-display">
                          <Info className="h-3.5 w-3.5" />
                          Descrição / Pauta
                        </h4>
                        <p className={`text-xs leading-relaxed font-normal ${darkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}

                    {userRole === 'admin' && (!selectedEvent.isHoliday && (
                      selectedEvent.commercialQuota ||
                      (selectedEvent.orcamento_total && selectedEvent.orcamento_total > 0) ||
                      (selectedEvent.custo_real && selectedEvent.custo_real > 0) ||
                      (selectedEvent.receita_estimada && selectedEvent.receita_estimada > 0) ||
                      (selectedEvent.custo_brindes && selectedEvent.custo_brindes > 0) ||
                      (selectedEvent.custo_uniformes && selectedEvent.custo_uniformes > 0) ||
                      (selectedEvent.custo_passagens && selectedEvent.custo_passagens > 0) ||
                      (selectedEvent.custo_hospedagem && selectedEvent.custo_hospedagem > 0)
                    )) && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-emerald-500 mb-4 flex items-center gap-1.5 font-display">
                          <DollarSign className="h-3.5 w-3.5" />
                          Dados Financeiros & Comerciais
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                          {selectedEvent.commercialQuota && (
                            <div className="col-span-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                              <span className="text-zinc-405 dark:text-zinc-500 text-[8px] font-bold uppercase tracking-wider block">Cota Comercial / Detalhes de Parceria</span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400 mt-1 block">{selectedEvent.commercialQuota}</span>
                            </div>
                          )}
                          
                          {selectedEvent.orcamento_total > 0 && (
                            <div className="p-3 rounded-xl bg-zinc-950/20 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/5">
                              <span className="text-zinc-405 dark:text-zinc-500 text-[8px] font-bold uppercase tracking-wider block">Orçamento Aprovado</span>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">R$ {selectedEvent.orcamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          {selectedEvent.custo_real > 0 && (
                            <div className="p-3 rounded-xl bg-zinc-950/20 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/5">
                              <span className="text-zinc-405 dark:text-zinc-500 text-[8px] font-bold uppercase tracking-wider block">Custo Real Consolidado</span>
                              <span className={`font-bold mt-1 block ${selectedEvent.custo_real > selectedEvent.orcamento_total && selectedEvent.orcamento_total > 0 ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                R$ {selectedEvent.custo_real.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}

                          {selectedEvent.receita_estimada > 0 && (
                            <div className="p-3 rounded-xl bg-zinc-950/20 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/5">
                              <span className="text-zinc-405 dark:text-zinc-500 text-[8px] font-bold uppercase tracking-wider block">Receita Estimada (ROI)</span>
                              <span className="font-bold text-emerald-500 mt-1 block">R$ {selectedEvent.receita_estimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>

                        {/* Sub-costs breakdown (brindes, uniformes, viagens, etc.) */}
                        {(selectedEvent.custo_brindes > 0 || selectedEvent.custo_uniformes > 0 || selectedEvent.custo_passagens > 0 || selectedEvent.custo_hospedagem > 0) && (
                          <div className="space-y-2 pt-3 border-t border-slate-200/50 dark:border-white/5">
                            <span className="text-zinc-405 dark:text-zinc-500 text-[8px] font-bold uppercase tracking-wider block mb-2">Detalhamento de Custos</span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                              {selectedEvent.custo_brindes > 0 && (
                                <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                                  <span>Brindes/Estoque:</span>
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">R$ {selectedEvent.custo_brindes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              {selectedEvent.custo_uniformes > 0 && (
                                <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                                  <span>Uniformes:</span>
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">R$ {selectedEvent.custo_uniformes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              {selectedEvent.custo_passagens > 0 && (
                                <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                                  <span>Passagens Aéreas:</span>
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">R$ {selectedEvent.custo_passagens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              {selectedEvent.custo_hospedagem > 0 && (
                                <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                                  <span>Hospedagem:</span>
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">R$ {selectedEvent.custo_hospedagem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedEvent.benefitsDeliverables && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-emerald-500 mb-2 flex items-center gap-1.5 font-display">
                          <Sparkles className="h-3.5 w-3.5" />
                          Benefícios / Entregáveis
                        </h4>
                        <p className={`text-xs leading-relaxed font-normal ${darkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                          {selectedEvent.benefitsDeliverables}
                        </p>
                      </div>
                    )}

                    {selectedEvent.internalObservations && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200/60 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-amber-500 mb-2 flex items-center gap-1.5 font-display">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Observações Internas
                        </h4>
                        <p className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-amber-305' : 'text-amber-800'}`}>
                          {selectedEvent.internalObservations}
                        </p>
                      </div>
                    )}

                    {selectedEvent.targetAudience && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-purple-500 mb-2 flex items-center gap-1.5 font-display">
                          <Users className="h-3.5 w-3.5" />
                          Público Alvo
                        </h4>
                        <p className={`text-xs leading-relaxed font-normal ${darkMode ? 'text-zinc-300' : 'text-zinc-655'}`}>
                          {selectedEvent.targetAudience}
                        </p>
                      </div>
                    )}

                    {selectedEvent.scope && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-teal-500 mb-2 flex items-center gap-1.5 font-display">
                          <Compass className="h-3.5 w-3.5" />
                          Abrangência Territorial
                        </h4>
                        <p className={`text-xs leading-relaxed font-normal ${darkMode ? 'text-zinc-300' : 'text-zinc-655'}`}>
                          {selectedEvent.scope}
                        </p>
                      </div>
                    )}

                    {selectedEvent.linksAndRepos && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-blue-500 mb-2 flex items-center gap-1.5 font-display">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Links / Anexos
                        </h4>
                        <a href={selectedEvent.linksAndRepos} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline break-all block">
                          {selectedEvent.linksAndRepos}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Teams, Clients & Gifts */}
                  <div className="space-y-6">
                    {/* Time Técnico / Staff */}
                    {selectedEvent.techTeam && selectedEvent.techTeam.length > 0 && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-indigo-500 mb-3 flex items-center gap-1.5 font-display">
                          <Users className="h-3.5 w-3.5" />
                          Equipe de Staff / Técnica ({selectedEvent.techTeam.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedEvent.techTeam.map((member: any, i:number) => (
                            <div key={i} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              darkMode ? 'bg-zinc-950/40 border-white/5' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-150">{member.member}</span>
                                {member.role && <span className="text-[10px] text-zinc-500 block mt-0.5">{member.role}</span>}
                              </div>
                              {member.size && (
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                  darkMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                }`}>
                                  Tam: {member.size}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clientes */}
                    {selectedEvent.clientList && selectedEvent.clientList.length > 0 && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-emerald-500 mb-3 flex items-center gap-1.5 font-display">
                          <UserCheck className="h-3.5 w-3.5" />
                          Lista de Clientes ({selectedEvent.clientList.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedEvent.clientList.map((client: any, i:number) => (
                            <div key={i} className={`p-2.5 rounded-xl border flex flex-col text-xs ${
                              darkMode ? 'bg-zinc-950/40 border-white/5' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-150">{client.name}</span>
                              {client.role && <span className="text-[10px] text-zinc-500 mt-0.5">{client.role}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* VIPs */}
                    {selectedEvent.vipList && selectedEvent.vipList.length > 0 && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-purple-500 mb-3 flex items-center gap-1.5 font-display">
                          <UserCheck className="h-3.5 w-3.5" />
                          Lista de VIPs ({selectedEvent.vipList.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedEvent.vipList.map((vip: any, i:number) => (
                            <div key={i} className={`p-2.5 rounded-xl border flex flex-col text-xs ${
                              darkMode ? 'bg-zinc-950/40 border-white/5' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-150">{vip.name}</span>
                              {vip.obs && <span className="text-[10px] text-zinc-500 mt-0.5">{vip.obs}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brindes Alocados */}
                    {selectedEvent.brindes_alocados && selectedEvent.brindes_alocados.length > 0 && (
                      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-amber-500 mb-3 flex items-center gap-1.5 font-display">
                          <Package className="h-3.5 w-3.5" />
                          Brindes / Estoque Alocado
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {selectedEvent.brindes_alocados.map((gift: any, i:number) => (
                            <div key={i} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              darkMode ? 'bg-zinc-950/40 border-white/5' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className="font-medium text-zinc-905 dark:text-zinc-150">{gift.item}</span>
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                                darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                              }`}>
                                Qtd: {gift.qtd}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Logística de Viagens */}
                    {(() => {
                      const relatedTravels = viagens.filter(v => 
                        v.evento_relacionado && 
                        (v.evento_relacionado === selectedEvent.id || 
                         v.evento_relacionado.toLowerCase().trim() === selectedEvent.title.toLowerCase().trim())
                      );
                      if (relatedTravels.length === 0) return null;
                      return (
                        <div className={`p-5 rounded-2xl border transition-all ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <h4 className="text-[10px] font-bold tracking-widest uppercase text-sky-500 mb-3 flex items-center gap-1.5 font-display">
                            <Plane className="h-3.5 w-3.5" />
                            Logística de Viagens ({relatedTravels.length})
                          </h4>
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                            {relatedTravels.map((travel: any, idx: number) => (
                              <div key={idx} className={`p-3 rounded-xl border space-y-2 text-xs ${
                                darkMode ? 'bg-zinc-950/40 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-zinc-900'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold">{travel.passageiro}</span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    travel.status === 'confirmada' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                    travel.status === 'concluida' ? 'bg-zinc-500/10 text-zinc-550 border border-zinc-500/20' :
                                    travel.status === 'cancelada' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                    'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                  }`}>
                                    {travel.status || 'planejada'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500">
                                  <div>
                                    <span className="font-semibold block text-zinc-400">Origem ➔ Destino</span>
                                    <span>{travel.origem || 'N/A'} ➔ {travel.destino || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-semibold block text-zinc-400">Transporte</span>
                                    <span>{travel.tipo_transporte || 'Aéreo'}</span>
                                  </div>
                                  {(travel.data_ida || travel.data_volta) && (
                                    <div className="col-span-2">
                                      <span className="font-semibold block text-zinc-400">Período</span>
                                      <span>
                                        {travel.data_ida ? new Date(travel.data_ida).toLocaleDateString('pt-BR') : 'N/A'} 
                                        {travel.data_volta ? ` até ${new Date(travel.data_volta).toLocaleDateString('pt-BR')}` : ''}
                                      </span>
                                    </div>
                                  )}
                                  {travel.hotel && (
                                    <div className="col-span-2">
                                      <span className="font-semibold block text-zinc-400">Hospedagem</span>
                                      <span>{travel.hotel}</span>
                                    </div>
                                  )}
                                  {travel.custo_total > 0 && (
                                    <div className="col-span-2 pt-1.5 border-t border-slate-200/50 dark:border-white/5">
                                      <span className="font-bold text-zinc-700 dark:text-zinc-350">
                                        Custo Viagem: <span className="text-emerald-500">R$ {travel.custo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Extrato de Lançamentos Financeiros */}
                {userRole === 'admin' && selectedEvent.lancamentos_financeiros && selectedEvent.lancamentos_financeiros.length > 0 && (
                  <div className={`p-5 rounded-2xl border transition-all mt-6 ${
                    darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-indigo-500 mb-3 flex items-center gap-1.5 font-display font-semibold">
                      <DollarSign className="h-3.5 w-3.5" />
                      Extrato de Lançamentos Financeiros ({selectedEvent.lancamentos_financeiros.length})
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-white/5">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={`border-b text-[9px] font-bold uppercase tracking-wider text-zinc-400 ${
                            darkMode ? 'border-white/5 bg-zinc-950/20' : 'border-slate-100 bg-slate-50'
                          }`}>
                            <th className="py-2.5 px-4">Conta</th>
                            <th className="py-2.5 px-4">Lançamento</th>
                            <th className="py-2.5 px-4">Vencimento</th>
                            <th className="py-2.5 px-4">Fornecedor</th>
                            <th className="py-2.5 px-4">Descrição/Observações</th>
                            <th className="py-2.5 px-4 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[11px]">
                          {selectedEvent.lancamentos_financeiros.map((lan: any, idx: number) => {
                            const formatDate = (d: any) => {
                              if (!d) return '--';
                              if (typeof d === 'number') {
                                const date = new Date((d - 25569) * 86400 * 1000);
                                return date.toLocaleDateString('pt-BR');
                              }
                              if (typeof d === 'string' && d.includes('-')) {
                                const parts = d.split('-');
                                if (parts.length === 3) {
                                  return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                }
                              }
                              return String(d);
                            };
                            return (
                              <tr key={idx} className="hover:bg-slate-500/5">
                                <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{lan.descConta}</td>
                                <td className="py-2.5 px-4 whitespace-nowrap">{formatDate(lan.dataLancamento)}</td>
                                <td className="py-2.5 px-4 whitespace-nowrap">{formatDate(lan.dataVencimento)}</td>
                                <td className="py-2.5 px-4 text-zinc-700 dark:text-zinc-350">{lan.fornecedor || '--'}</td>
                                <td className="py-2.5 px-4 max-w-xs truncate text-zinc-500 dark:text-zinc-400" title={lan.observacoes}>{lan.observacoes || '--'}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-zinc-800 dark:text-zinc-150">
                                  R$ {Number(lan.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                </>
              )}

              {/* Google Search Grounding Metadata */}
              {(selectedEvent.sourceUrl || selectedEvent.reasoning) && (
                <div className={`p-4.5 rounded-2xl border ${
                  darkMode ? 'bg-indigo-950/20 border-indigo-500/25 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                } space-y-2.5`}>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">Google Search Grounding</span>
                  </div>
                  {selectedEvent.reasoning && (
                    <p className={`text-xs leading-relaxed font-semibold opacity-90`}>
                      {selectedEvent.reasoning}
                    </p>
                  )}
                  {selectedEvent.sourceUrl && (
                    <div className="pt-1">
                      <a 
                        href={selectedEvent.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm group"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Ver Fonte Oficial</span>
                        <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Context Action Banner for Holidays */}
              {selectedEvent.isHoliday && (
                <div className="flex items-start space-x-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold font-display">Instrução de Escala & Expediente</h5>
                    <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                      Este dia é considerado recesso corporativo oficial {selectedEvent.scope ? `para a localidade de ${selectedEvent.scope}` : 'nacional'}. Suas atividades corporativas não essenciais estão suspensas.
                    </p>
                  </div>
                </div>
              )}

              {/* Action layout bar inside detailed panel */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200/40 dark:border-white/5 justify-between items-center font-sans">
                
                <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-center sm:justify-start">
                  {!selectedEvent.isHoliday && (
                    <button 
                      onClick={(e) => handleToggleBookmark(selectedEvent.id, e)}
                      className="p-3 rounded-xl border border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
                      title="Favoritar"
                    >
                      <Heart className={`h-4.5 w-4.5 ${savedEventIds.includes(selectedEvent.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      showToast("Link do convite copiado para a área de transferência corporativa!");
                    }}
                    className="p-3 rounded-xl border border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors" 
                    title="Compartilhar"
                  >
                    <Share2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  {userRole === 'admin' && (
                    <button 
                      type="button"
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors inline-flex items-center justify-center space-x-1.5 font-sans"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Excluir</span>
                    </button>
                  )}
                  <button 
                    onClick={() => handleStartEdit(selectedEvent)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors inline-flex items-center justify-center space-x-1.5 font-sans"
                  >
                    <Pencil className="h-3.5 w-3.5 text-indigo-505" />
                    <span>Editar</span>
                  </button>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors font-sans"
                  >
                    Voltar
                  </button>
                  {!selectedEvent.isHoliday && (
                    <button 
                      onClick={() => {
                        showToast(`Inscrição confirmada na pauta de ${selectedEvent.category}!`);
                        setSelectedEvent(null);
                      }}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-805 dark:hover:bg-zinc-100 shadow-md transition-all font-sans"
                    >
                      Marcar Presença
                    </button>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      </>
      )}

      {/* ===== PAINEL ADMIN ===== */}
      {activeMainTab === 'Painel Admin' && userRole === 'admin' && (
        <AdminErrorBoundary darkMode={darkMode}>
          <AdminDashboard 
            darkMode={darkMode} 
            events={events}
            onEditEvent={handleStartEdit}
            onDeleteEvent={handleDeleteEvent}
            onAddEvent={handleOpenCreateModal}
            onViewEvent={(event) => setSelectedEvent(event)}
          />
        </AdminErrorBoundary>
      )}

      {/* Creator Modal Box */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          <div 
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
            onClick={() => setIsAddOpen(false)}
          />

          <div className={`relative w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl border transform transition-all animate-spring-in z-30 flex flex-col max-h-[90vh] ${
            darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-slate-200 text-zinc-900'
          }`}>
            
            {/* Form modal title header */}
            <div className="px-8 py-6 border-b border-slate-200/40 dark:border-white/5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold tracking-tight font-display">
                  {editingEventId ? 'Editar Pauta / Evento' : 'Registrar Pauta / Evento Interno'}
                </h3>
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-400 dark:text-zinc-500 mt-1">Tripla Creator Studio</p>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Internal Tabs */}
            <div className={`flex items-center overflow-x-auto px-8 pt-4 border-b shrink-0 ${darkMode ? 'border-white/5 bg-zinc-900/50' : 'border-slate-200/50 bg-slate-50/50'} custom-scrollbar`}>
              {['Dados Básicos', 'Logística & Listas', 'Financeiro', 'Arquivos & Histórico']
                .filter(tab => tab !== 'Financeiro' || userRole === 'admin')
                .map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveModalTab(tab)}
                    className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${activeModalTab === tab ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    {tab}
                  </button>
                ))}
            </div>

            {/* Event Form details */}
            <form onSubmit={handleCreateEvent} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
              
              {activeModalTab === 'Dados Básicos' && (
                <div className="space-y-10 animate-fade-in">
              
              {/* === SECTION 1: Dados Identificadores === */}
              <div className="space-y-5">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-650 dark:text-zinc-300">Dados Identificadores</h4>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Nome do Evento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Digite o nome do evento..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={`w-full p-4 rounded-xl border text-sm font-medium outline-none transition-all ${
                      darkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-505'
                    }`}
                  />

                  <div className="mt-4">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 flex justify-between items-center">
                      <span>URL da Imagem de Capa (Opcional)</span>
                      <button 
                        type="button" 
                        onClick={handleImageSearch}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold"
                        disabled={isSearchingImage}
                      >
                        {isSearchingImage ? 'Buscando...' : 'Buscar Imagens pelo Título'}
                      </button>
                    </label>
                    <input
                      type="url"
                      placeholder="Cole a URL da imagem de capa ou busque acima..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className={`w-full p-4 rounded-xl border text-sm font-medium outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-505'
                      }`}
                    />
                    
                    {imageSearchError && <p className="text-xs text-red-500 mt-2">{imageSearchError}</p>}
                    
                    {imageSearchResults.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {imageSearchResults.map((url, i) => (
                          <button 
                            key={i} 
                            type="button"
                            onClick={() => setNewImageUrl(url)}
                            className="aspect-video w-full rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500"
                          >
                            <img src={url} alt={`Resultado ${i+1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* AI Grounding Fast Trigger Button inside Form */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-semibold select-none">
                      {newTitle.trim() ? 'IA pode buscar datas e local deste evento' : 'Digite o título e use a busca Google'}
                    </span>
                    <button
                      type="button"
                      disabled={isSearchingGoogleInForm || !newTitle.trim()}
                      onClick={handleInlineGoogleSearch}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-150 dark:disabled:bg-zinc-800/60 disabled:text-zinc-400 hover:scale-[1.01] active:scale-[0.98] text-white text-[9px] font-extrabold uppercase tracking-wider transition-all shadow-sm"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>{isSearchingGoogleInForm ? 'Buscando no Google...' : 'Buscar Detalhes no Google'}</span>
                    </button>
                  </div>

                  {/* Loading feedback */}
                  {isSearchingGoogleInForm && (
                    <div className="mt-3.5 space-y-3.5">
                      <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/15 text-indigo-600 dark:text-indigo-400 text-xs font-semibold animate-pulse border border-indigo-100 dark:border-indigo-950/40">
                        <Globe className="h-4 w-4 animate-spin shrink-0 text-indigo-500" />
                        <span>Consultando Google Search por "{newTitle}" em tempo real corporativo...</span>
                      </div>
                    </div>
                  )}

                  {/* Error Banner */}
                  {formGoogleSearchError && (
                    <div className="mt-3 flex items-start space-x-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/15 text-rose-700 dark:text-rose-450 text-[11px] border border-rose-200 dark:border-rose-900/30">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="font-semibold">{formGoogleSearchError}</p>
                    </div>
                  )}

                  {/* Dynamic Google Approval Prompt box inside modal */}
                  {formGoogleSearchResult && (
                    <div className={`mt-3.5 p-4 rounded-2xl border transition-all animate-spring-in ${
                      darkMode ? 'bg-indigo-950/20 border-indigo-500/25 text-indigo-200' : 'bg-indigo-50/50 border-indigo-200 text-indigo-950'
                    } space-y-3.5`}>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-indigo-500 animate-[spin_6s_linear_infinite]" />
                        <span className="text-[9px] font-bold tracking-widest uppercase text-indigo-500 dark:text-indigo-400">Recomendação Encontrada no Google</span>
                      </div>

                      <div className="space-y-1.5 text-[11px] leading-snug">
                        <p className="font-normal text-zinc-500 dark:text-zinc-400">
                          A IA encontrou dados reais. Selecione o que deseja preencher no formulário:
                        </p>
                        
                        <div className="bg-white/40 dark:bg-zinc-950/40 p-3 rounded-xl space-y-2 text-zinc-800 dark:text-zinc-200 border border-slate-200/20">
                          {formGoogleSearchResult.title && (
                            <label className="flex items-start cursor-pointer group">
                              <input type="checkbox" checked={!!selectedGoogleFields['title']} onChange={() => setSelectedGoogleFields(prev => ({...prev, title: !prev.title}))} className="mt-0.5 mr-2 accent-indigo-500 rounded border-zinc-300" />
                              <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"><strong className="text-indigo-500 dark:text-indigo-400">Título Sugerido:</strong> {formGoogleSearchResult.title}</span>
                            </label>
                          )}
                          {formGoogleSearchResult.date && (
                            <label className="flex items-start cursor-pointer group">
                              <input type="checkbox" checked={!!selectedGoogleFields['date']} onChange={() => setSelectedGoogleFields(prev => ({...prev, date: !prev.date}))} className="mt-0.5 mr-2 accent-indigo-500 rounded border-zinc-300" />
                              <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"><strong className="text-indigo-500 dark:text-indigo-400">Data Sugerida:</strong> {formGoogleSearchResult.date} {formGoogleSearchResult.endDate && ` a ${formGoogleSearchResult.endDate}`}</span>
                            </label>
                          )}
                          {formGoogleSearchResult.time && (
                            <label className="flex items-start cursor-pointer group">
                              <input type="checkbox" checked={!!selectedGoogleFields['time']} onChange={() => setSelectedGoogleFields(prev => ({...prev, time: !prev.time}))} className="mt-0.5 mr-2 accent-indigo-500 rounded border-zinc-300" />
                              <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"><strong className="text-indigo-500 dark:text-indigo-400">Hora Recomendada:</strong> {formGoogleSearchResult.time} {formGoogleSearchResult.endTime && ` às ${formGoogleSearchResult.endTime}`}</span>
                            </label>
                          )}
                          {formGoogleSearchResult.location && (
                            <label className="flex items-start cursor-pointer group">
                              <input type="checkbox" checked={!!selectedGoogleFields['location']} onChange={() => setSelectedGoogleFields(prev => ({...prev, location: !prev.location}))} className="mt-0.5 mr-2 accent-indigo-500 rounded border-zinc-300" />
                              <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"><strong className="text-indigo-500 dark:text-indigo-400">Localização vinculada:</strong> {formGoogleSearchResult.location}</span>
                            </label>
                          )}
                          {formGoogleSearchResult.targetAudience && (
                            <label className="flex items-start cursor-pointer group">
                              <input type="checkbox" checked={!!selectedGoogleFields['targetAudience']} onChange={() => setSelectedGoogleFields(prev => ({...prev, targetAudience: !prev.targetAudience}))} className="mt-0.5 mr-2 accent-indigo-500 rounded border-zinc-300" />
                              <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"><strong className="text-indigo-500 dark:text-indigo-400">Público:</strong> {formGoogleSearchResult.targetAudience}</span>
                            </label>
                          )}
                          {formGoogleSearchResult.benefitsDeliverables && (
                            <label className="flex items-start cursor-pointer group">
                              <input type="checkbox" checked={!!selectedGoogleFields['benefitsDeliverables']} onChange={() => setSelectedGoogleFields(prev => ({...prev, benefitsDeliverables: !prev.benefitsDeliverables}))} className="mt-0.5 mr-2 accent-indigo-500 rounded border-zinc-300" />
                              <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"><strong className="text-indigo-500 dark:text-indigo-400">Benefícios:</strong> {formGoogleSearchResult.benefitsDeliverables}</span>
                            </label>
                          )}
                          {formGoogleSearchResult.internalObservations && (
                            <label className="flex items-start cursor-pointer group">
                              <input type="checkbox" checked={!!selectedGoogleFields['internalObservations']} onChange={() => setSelectedGoogleFields(prev => ({...prev, internalObservations: !prev.internalObservations}))} className="mt-0.5 mr-2 accent-indigo-500 rounded border-zinc-300" />
                              <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"><strong className="text-indigo-500 dark:text-indigo-400">Obs. Internas:</strong> {formGoogleSearchResult.internalObservations}</span>
                            </label>
                          )}
                          {formGoogleSearchResult.linksAndRepos && (
                            <label className="flex items-start cursor-pointer group">
                              <input type="checkbox" checked={!!selectedGoogleFields['linksAndRepos']} onChange={() => setSelectedGoogleFields(prev => ({...prev, linksAndRepos: !prev.linksAndRepos}))} className="mt-0.5 mr-2 accent-indigo-500 rounded border-zinc-300" />
                              <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"><strong className="text-indigo-500 dark:text-indigo-400">Links:</strong> {formGoogleSearchResult.linksAndRepos}</span>
                            </label>
                          )}
                          {formGoogleSearchResult.description && (
                            <label className="flex items-start cursor-pointer group">
                              <input type="checkbox" checked={!!selectedGoogleFields['description']} onChange={() => setSelectedGoogleFields(prev => ({...prev, description: !prev.description}))} className="mt-0.5 mr-2 accent-indigo-500 rounded border-zinc-300" />
                              <div className="flex flex-col w-full">
                                <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"><strong className="text-indigo-500 dark:text-indigo-400">Resumo / Descrição:</strong></span>
                                <span className="text-[10px] text-zinc-550 dark:text-zinc-300 italic mt-1 font-medium bg-black/5 dark:bg-black/10 p-1.5 rounded group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors block w-full">
                                  "{formGoogleSearchResult.description}"
                                </span>
                              </div>
                            </label>
                          )}
                          {formGoogleSearchResult.reasoning && (
                            <p className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                              ✨ {formGoogleSearchResult.reasoning}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-indigo-500/10 dark:border-indigo-500/5">
                        <button
                          type="button"
                          onClick={() => {
                            setFormGoogleSearchResult(null);
                            showToast('Sugestão de dados ignorada.');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider border text-zinc-600 dark:text-zinc-300 transition-colors ${
                            darkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Descartar
                        </button>
                        <button
                          type="button"
                          onClick={handleApproveFormGoogleSearch}
                          className="px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm select-none"
                        >
                          Aprovar & Preencher
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Data Início *</label>
                    <input
                      type="date"
                      required
                      value={newDateStr}
                      onChange={(e) => setNewDateStr(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-505'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Data Fim *</label>
                    <input
                      type="date"
                      required
                      value={newEndDateStr}
                      onChange={(e) => setNewEndDateStr(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-505'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Hora Início *</label>
                    <input
                      type="time"
                      required
                      value={newTimeStr}
                      onChange={(e) => setNewTimeStr(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-505'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Hora Fim *</label>
                    <input
                      type="time"
                      required
                      value={newEndTimeStr}
                      onChange={(e) => setNewEndTimeStr(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-505'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Tipo de Evento</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {CATEGORIES.filter(cat => cat !== 'Todos').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Status Operacional</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="em negociação">Em Negociação</option>
                      <option value="planejado">Planejado</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="concluído">Concluído</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Responsável pelo Evento</label>
                    <select
                      value={newHost}
                      onChange={(e) => setNewHost(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition-all focus:border-indigo-500 ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-zinc-900'
                      }`}
                    >
                      <option value="">Selecione o responsável...</option>
                      {usersList
                        .filter(u => u.role === 'admin' || u.role === 'approved')
                        .map(u => u.nome || u.email)
                        .filter(Boolean)
                        .filter((val, idx, self) => self.indexOf(val) === idx)
                        .concat(newHost && !usersList.some(u => (u.nome === newHost || u.email === newHost)) ? [newHost] : [])
                        .sort((a, b) => a.localeCompare(b))
                        .map(name => {
                          const associatedUser = usersList.find(u => u.nome === name || u.email === name);
                          const label = associatedUser 
                            ? `${name} (${associatedUser.role === 'admin' ? 'Admin' : 'Usuário'})` 
                            : name;
                          return (
                            <option key={name} value={name}>
                              {label}
                            </option>
                          );
                        })
                      }
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200/50 dark:border-white/5" />

              {/* === SECTION 2: Local e Canais === */}
              <div className="space-y-5">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">2</span>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-650 dark:text-zinc-300">Local e Canais</h4>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Localização física / link principal</label>
                  <input
                    type="text"
                    placeholder="Ex: Escritório SP, Hotel Transamérica..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className={`w-full p-4 rounded-xl border text-sm font-medium outline-none transition-all ${
                      darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Formato</label>
                    <select
                      value={newFormat}
                      onChange={(e) => setNewFormat(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {FORMATS.filter(f => f !== 'Todos').map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Cota Comercial</label>
                    <input
                      type="text"
                      placeholder="Ex: Gold, Silver, Master..."
                      value={newCommercialQuota}
                      onChange={(e) => setNewCommercialQuota(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Links e Repositórios (Um por linha)</label>
                  <textarea
                    rows={3}
                    placeholder="https://..."
                    value={newLinksAndRepos}
                    onChange={(e) => setNewLinksAndRepos(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all resize-none ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                  />
                </div>
              </div>

              <hr className="border-slate-200/50 dark:border-white/5" />

                </div>
              )}

              {activeModalTab === 'Logística & Listas' && (
                <div className="space-y-10 animate-fade-in">
              {/* === SECTION 3: Participantes e Equipe === */}
              <div className="space-y-5">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-650 dark:text-zinc-300">Participantes e Equipe</h4>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Staff (Qtd)</label>
                    <input
                      type="number"
                      value={newStaffCount}
                      onChange={(e) => setNewStaffCount(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-indigo-400' : 'bg-slate-50 border-slate-200 text-indigo-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Clientes (Qtd)</label>
                    <input
                      type="number"
                      value={newClientCount}
                      onChange={(e) => setNewClientCount(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-emerald-500' : 'bg-slate-50 border-slate-200 text-emerald-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">VIPs (Qtd)</label>
                    <input
                      type="number"
                      value={newVipCount}
                      onChange={(e) => setNewVipCount(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                        darkMode ? 'bg-zinc-950 border-white/5 text-purple-400' : 'bg-slate-50 border-slate-200 text-purple-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Additional Notification Field as well */}
                <div className="mt-4">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 flex items-center space-x-1">
                    <Bell className="h-3 w-3" />
                    <span>Lembretes por E-mail / Push</span>
                  </label>
                  <select
                    value={newReminder}
                    onChange={(e) => setNewReminder(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs font-semibold outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-zinc-900 focus:border-indigo-500'
                    }`}
                  >
                    <option value="none">Sem Lembrete Antecipado</option>
                    <option value="15m">15 minutos antes</option>
                    <option value="30m">30 minutos antes</option>
                    <option value="1h">1 hora antes</option>
                    <option value="1d">1 dia antes (Resumo Diário)</option>
                  </select>
                </div>

                {/* Lists Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Clientes */}
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-emerald-500 mb-3">Lista de Clientes</label>
                    <div className="flex gap-2 mb-3">
                      <input 
                        value={newClientName} 
                        onChange={(e) => setNewClientName(e.target.value)} 
                        placeholder="Nome" 
                        className={`flex-1 p-2.5 rounded-lg border text-xs font-medium outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`}
                      />
                      <input 
                        value={newClientRole} 
                        onChange={(e) => setNewClientRole(e.target.value)} 
                        placeholder="Cargo/Empresa" 
                        className={`w-1/3 p-2.5 rounded-lg border text-xs font-medium outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newClientName.trim()) {
                              setNewClientList([...newClientList, { name: newClientName, role: newClientRole }]);
                              setNewClientName('');
                              setNewClientRole('');
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (newClientName.trim()) {
                            setNewClientList([...newClientList, { name: newClientName, role: newClientRole }]);
                            setNewClientName('');
                            setNewClientRole('');
                          }
                        }}
                        className="p-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {newClientList.map((client, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-slate-200'}`}>
                          <div>
                            <p className={`text-xs font-bold ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{client.name}</p>
                            {client.role && <p className="text-[10px] text-zinc-500">{client.role}</p>}
                          </div>
                          <button 
                            type="button"
                            onClick={() => setNewClientList(newClientList.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {newClientList.length === 0 && (
                        <p className="text-[10px] text-zinc-500 text-center py-2 italic">Nenhum cliente adicionado</p>
                      )}
                    </div>
                  </div>

                  {/* VIPs */}
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-500 mb-3">Lista de VIPs</label>
                    <div className="flex gap-2 mb-3">
                      <input 
                        value={newVipName} 
                        onChange={(e) => setNewVipName(e.target.value)} 
                        placeholder="Nome" 
                        className={`flex-1 p-2.5 rounded-lg border text-xs font-medium outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`}
                      />
                      <input 
                        value={newVipObs} 
                        onChange={(e) => setNewVipObs(e.target.value)} 
                        placeholder="Obs (Opcional)" 
                        className={`w-1/3 p-2.5 rounded-lg border text-xs font-medium outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newVipName.trim()) {
                              setNewVipList([...newVipList, { name: newVipName, obs: newVipObs }]);
                              setNewVipName('');
                              setNewVipObs('');
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (newVipName.trim()) {
                            setNewVipList([...newVipList, { name: newVipName, obs: newVipObs }]);
                            setNewVipName('');
                            setNewVipObs('');
                          }
                        }}
                        className="p-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {newVipList.map((vip, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-slate-200'}`}>
                          <div>
                            <p className={`text-xs font-bold ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{vip.name}</p>
                            {vip.obs && <p className="text-[10px] text-zinc-500">{vip.obs}</p>}
                          </div>
                          <button 
                            type="button"
                            onClick={() => setNewVipList(newVipList.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {newVipList.length === 0 && (
                        <p className="text-[10px] text-zinc-500 text-center py-2 italic">Nenhum VIP adicionado</p>
                      )}
                    </div>
                  </div>

                  {/* Staff */}
                  <div className={`p-4 rounded-xl border col-span-1 md:col-span-2 ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-indigo-500 mb-3">Equipe Staff / Técnica</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <select 
                        value={selectedParticipantId} 
                        onChange={(e) => {
                          const pId = e.target.value;
                          setSelectedParticipantId(pId);
                          if (pId) {
                            const p = participantes.find(x => x.id === pId);
                            if (p) {
                              setNewTechMember(p.nome || '');
                              setNewTechRole(p.cargo || p.funcao || '');
                              setNewTechSize(p.tamanho || 'M');
                            }
                          } else {
                            setNewTechMember('');
                            setNewTechRole('');
                            setNewTechSize('M');
                          }
                        }}
                        className={`p-2.5 rounded-lg border text-xs font-semibold outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200 text-zinc-900'}`}
                      >
                        <option value="">Selecionar da Base (Opcional)...</option>
                        {participantes.sort((a,b) => (a.nome || '').localeCompare(b.nome || '')).map(p => (
                          <option key={p.id} value={p.id}>{p.nome} ({p.cargo || p.funcao || 'Sem Cargo'})</option>
                        ))}
                      </select>
                      <input 
                        value={newTechMember} 
                        onChange={(e) => setNewTechMember(e.target.value)} 
                        placeholder="Nome Personalizado" 
                        className={`p-2.5 rounded-lg border text-xs font-medium outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`}
                      />
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input 
                        value={newTechRole} 
                        onChange={(e) => setNewTechRole(e.target.value)} 
                        placeholder="Função" 
                        className={`w-1/4 p-2.5 rounded-lg border text-xs font-medium outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`}
                      />
                      <select 
                        value={newTechSize} 
                        onChange={(e) => setNewTechSize(e.target.value)} 
                        className={`w-20 p-2.5 rounded-lg border text-xs font-medium outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`}
                      >
                        <option value="P">P</option>
                        <option value="M">M</option>
                        <option value="G">G</option>
                        <option value="GG">GG</option>
                        <option value="XG">XG</option>
                      </select>
                      <button 
                        type="button"
                        onClick={() => {
                          if (newTechMember.trim()) {
                            setNewTechTeam([...newTechTeam, { member: newTechMember, role: newTechRole, size: newTechSize }]);
                            setNewTechMember('');
                            setNewTechRole('');
                          }
                        }}
                        className="p-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
                      {newTechTeam.map((tech, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-slate-200'}`}>
                          <div>
                            <p className={`text-xs font-bold flex items-center gap-1.5 ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                              {tech.member} 
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                                Tam: {tech.size}
                              </span>
                            </p>
                            {tech.role && <p className="text-[10px] text-zinc-500 mt-0.5">{tech.role}</p>}
                          </div>
                          <button 
                            type="button"
                            onClick={() => setNewTechTeam(newTechTeam.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {newTechTeam.length === 0 && (
                        <div className="col-span-full">
                          <p className="text-[10px] text-zinc-500 text-center py-2 italic">Nenhum staff adicionado</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alocação de Brindes */}
                  <div className={`p-4 rounded-xl border col-span-1 md:col-span-2 ${darkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />
                      Alocação de Brindes / Estoque
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <select 
                        value={selectedGiftId} 
                        onChange={e => setSelectedGiftId(e.target.value)} 
                        className={`flex-1 p-2.5 rounded-lg border text-xs font-semibold outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200 text-zinc-900'}`}
                      >
                        <option value="">Selecione um item do estoque...</option>
                        {inventoryItems.map((item: any) => (
                          <option key={item.id} value={item.id}>
                            {item.nome} (Saldo: {item.quantidade || 0}) [{item._collection || 'Estoque'}]
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          min="1" 
                          value={selectedGiftQty} 
                          onChange={e => setSelectedGiftQty(parseInt(e.target.value) || 1)} 
                          className={`w-20 p-2.5 rounded-lg border text-xs font-bold outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`} 
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const item = inventoryItems.find(i => i.id === selectedGiftId);
                            if (item) {
                              if (item.quantidade < selectedGiftQty) {
                                showToast(`Saldo insuficiente! Apenas ${item.quantidade} unidades disponíveis.`);
                                return;
                              }
                              const existing = newAllocatedGifts.find(g => (g.docId || g.id) === item.id);
                              if (existing) {
                                setNewAllocatedGifts(newAllocatedGifts.map(g => (g.docId || g.id) === item.id ? { ...g, qtd: g.qtd + selectedGiftQty } : g));
                              } else {
                                setNewAllocatedGifts([...newAllocatedGifts, { docId: item.id, item: item.nome, qtd: selectedGiftQty, _collection: item._collection }]);
                              }
                              setSelectedGiftId('');
                              setSelectedGiftQty(1);
                            }
                          }}
                          className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase transition-colors"
                        >
                          Alocar
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {newAllocatedGifts.map((gift, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-slate-200'}`}>
                          <div>
                            <p className={`text-xs font-bold ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{gift.item}</p>
                            <p className="text-[10px] text-zinc-500">Categoria: {gift._collection || 'Estoque'}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500`}>Qtd: {gift.qtd}</span>
                            <button 
                              type="button"
                              onClick={() => setNewAllocatedGifts(newAllocatedGifts.filter((_, i) => i !== idx))}
                              className="p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {newAllocatedGifts.length === 0 && (
                        <p className="text-[10px] text-zinc-500 text-center py-2 italic font-medium">Nenhum brinde alocado para esta pauta/evento</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              <hr className="border-slate-200/50 dark:border-white/5" />

                </div>
              )}

              {activeModalTab === 'Financeiro' && userRole === 'admin' && (
                <div className="space-y-10 animate-fade-in">
                  <div className="space-y-5">
                    <div className="flex items-center space-x-3 mb-6">
                      <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">$</span>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-650 dark:text-zinc-300">Gestão Financeira V2</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Orçamento Total (R$)</label>
                        <input type="number" value={newOrcamentoTotal} onChange={(e) => setNewOrcamentoTotal(e.target.value)} className={`w-full p-3.5 rounded-xl border text-sm font-medium outline-none transition-all ${darkMode ? 'bg-zinc-955 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`} placeholder="Ex: 5000" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Custo Real (R$ - Somatória Calculada)</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={`R$ ${newLancamentosFinanceiros.reduce((acc, l) => acc + (Number(l.valor) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                          className={`w-full p-3.5 rounded-xl border text-sm font-semibold outline-none transition-all bg-slate-100/50 dark:bg-zinc-950 border-slate-200 dark:border-white/5 text-zinc-500`} 
                        />
                      </div>
                    </div>

                    {/* Lançamentos Detalhados Card */}
                    <div className="p-5 rounded-2xl border bg-slate-50/30 dark:bg-zinc-900/10 border-slate-200 dark:border-white/5 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-white/5">
                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">Lançamentos Detalhados</h5>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Adicione despesas manualmente ou faça a importação via planilha Excel para este evento.</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-md">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Importar Excel</span>
                            <input 
                              type="file" 
                              accept=".xlsx, .xls" 
                              onChange={handleExcelImport} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>

                      {/* Selector de Abas do Excel se houver mais de uma */}
                      {excelSheets.length > 1 && (
                        <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Planilha com Múltiplas Abas Detectada</span>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-405">Selecione qual aba de gastos corresponde a este evento:</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={selectedExcelSheet}
                              onChange={e => setSelectedExcelSheet(e.target.value)}
                              className="text-xs font-semibold rounded-xl px-2.5 py-1.5 border outline-none bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-slate-200 dark:border-white/10"
                            >
                              {excelSheets.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button
                              type="button"
                              onClick={handleConfirmExcelImport}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelExcelImport}
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-zinc-400 hover:text-zinc-650 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tabela de lançamentos existentes */}
                      <div className="overflow-x-auto max-h-60 rounded-xl border border-slate-200/60 dark:border-white/5">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className={`border-b text-[9px] font-bold uppercase tracking-wider text-zinc-400 ${darkMode ? 'border-white/5 bg-zinc-950/20' : 'border-slate-100 bg-slate-50'}`}>
                              <th className="py-2 px-3">Conta</th>
                              <th className="py-2 px-3">Lançamento</th>
                              <th className="py-2 px-3">Vencimento</th>
                              <th className="py-2 px-3">Observações</th>
                              <th className="py-2 px-3">Fornecedor</th>
                              <th className="py-2 px-3 text-right">Valor</th>
                              <th className="py-2 px-3 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[11px]">
                            {newLancamentosFinanceiros.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-6 text-center text-zinc-400 font-medium">Nenhuma despesa adicionada.</td>
                              </tr>
                            ) : (
                              newLancamentosFinanceiros.map((lan: any, idx: number) => {
                                const formatDate = (d: any) => {
                                  if (!d) return '--';
                                  if (typeof d === 'number') {
                                    const date = new Date((d - 25569) * 86400 * 1000);
                                    return date.toLocaleDateString('pt-BR');
                                  }
                                  return String(d);
                                };
                                return (
                                  <tr key={idx} className="hover:bg-slate-500/5">
                                    <td className="py-2 px-3 font-semibold">{lan.descConta}</td>
                                    <td className="py-2 px-3 whitespace-nowrap">{formatDate(lan.dataLancamento)}</td>
                                    <td className="py-2 px-3 whitespace-nowrap">{formatDate(lan.dataVencimento)}</td>
                                    <td className="py-2 px-3 max-w-xs truncate" title={lan.observacoes}>{lan.observacoes || '--'}</td>
                                    <td className="py-2 px-3">{lan.fornecedor || '--'}</td>
                                    <td className="py-2 px-3 text-right font-bold text-zinc-800 dark:text-zinc-150">
                                      R$ {Number(lan.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <button 
                                        type="button" 
                                        onClick={() => handleRemoveLancamento(idx)} 
                                        className="p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
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

                      {/* Inserção Manual Form Row */}
                      <div className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/40 dark:bg-zinc-950/20 space-y-3">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Inserir Lançamento Manual</span>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          <div>
                            <input 
                              type="text" 
                              placeholder="Conta (ex: Brindes)" 
                              value={manualConta} 
                              onChange={e => setManualConta(e.target.value)} 
                              className={`w-full p-2.5 rounded-xl border text-[11px] outline-none ${darkMode ? 'bg-zinc-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`} 
                            />
                          </div>
                          <div>
                            <input 
                              type="date" 
                              placeholder="Data Lanç." 
                              value={manualDataLancamento} 
                              onChange={e => setManualDataLancamento(e.target.value)} 
                              className={`w-full p-2.5 rounded-xl border text-[11px] outline-none ${darkMode ? 'bg-zinc-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`} 
                            />
                          </div>
                          <div>
                            <input 
                              type="date" 
                              placeholder="Data Venc." 
                              value={manualDataVencimento} 
                              onChange={e => setManualDataVencimento(e.target.value)} 
                              className={`w-full p-2.5 rounded-xl border text-[11px] outline-none ${darkMode ? 'bg-zinc-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`} 
                            />
                          </div>
                          <div>
                            <input 
                              type="text" 
                              placeholder="Fornecedor" 
                              value={manualFornecedor} 
                              onChange={e => setManualFornecedor(e.target.value)} 
                              className={`w-full p-2.5 rounded-xl border text-[11px] outline-none ${darkMode ? 'bg-zinc-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`} 
                            />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <input 
                              type="number" 
                              placeholder="Valor (R$)" 
                              value={manualValor} 
                              onChange={e => setManualValor(e.target.value)} 
                              className={`w-full p-2.5 rounded-xl border text-[11px] outline-none ${darkMode ? 'bg-zinc-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`} 
                            />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <button
                              type="button"
                              onClick={handleAddManualLancamento}
                              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                            >
                              Adicionar
                            </button>
                          </div>
                          <div className="col-span-2 md:col-span-6">
                            <input 
                              type="text" 
                              placeholder="Observações adicionais..." 
                              value={manualObservacoes} 
                              onChange={e => setManualObservacoes(e.target.value)} 
                              className={`w-full p-2.5 rounded-xl border text-[11px] outline-none ${darkMode ? 'bg-zinc-900 border-white/5 text-white focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500'}`} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Tipo Financeiro</label>
                        <select value={newTipoFinanceiro} onChange={(e) => setNewTipoFinanceiro(e.target.value)} className={`w-full p-3.5 rounded-xl border text-sm font-medium outline-none transition-all ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}>
                          <option value="">Selecione...</option>
                          <option value="Happy Hour">Happy Hour</option>
                          <option value="Segmento">Segmento</option>
                          <option value="Regional">Regional</option>
                          <option value="Nacional">Nacional</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">UF (Estado)</label>
                        <input type="text" value={newUf} onChange={(e) => setNewUf(e.target.value)} className={`w-full p-3.5 rounded-xl border text-sm font-medium outline-none transition-all ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="Ex: SP" />
                      </div>
                      <div className="flex items-center space-x-3 pt-6">
                        <input type="checkbox" id="apuracao" checked={newApuracaoFinalizada} onChange={(e) => setNewApuracaoFinalizada(e.target.checked)} className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="apuracao" className="text-[11px] font-bold uppercase text-zinc-600 dark:text-zinc-400 mt-1 cursor-pointer">Apuração Finalizada</label>
                      </div>
                    </div>

                    {/* Previsão Financeira */}
                    <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-zinc-900/30 border-slate-200 dark:border-white/5 mt-4">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-4">Previsão Comercial</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Previsão Pipe</label>
                          <input type="number" value={newPrevisaoPipe} onChange={(e) => setNewPrevisaoPipe(e.target.value)} className={`w-full p-3.5 rounded-xl border text-sm font-medium outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`} placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Prev. Fechamento</label>
                          <input type="number" value={newPrevisaoFechamento} onChange={(e) => setNewPrevisaoFechamento(e.target.value)} className={`w-full p-3.5 rounded-xl border text-sm font-medium outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`} placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Receita Estimada</label>
                          <input type="number" value={newReceitaEstimada} onChange={(e) => setNewReceitaEstimada(e.target.value)} className={`w-full p-3.5 rounded-xl border text-sm font-medium outline-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-slate-200'}`} placeholder="0" />
                        </div>
                      </div>
                    </div>

                    {/* Financeiro Legacy */}
                    <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center space-x-3 mb-6">
                        <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 border border-slate-200 dark:border-white/10 dark:text-zinc-300 flex items-center justify-center text-xs font-bold"><DollarSign className="h-4 w-4" /></span>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-650 dark:text-zinc-300">Detalhamento de Custos (Legado)</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Brindes (R$)</label>
                          <input type="number" value={newCustoBrindes} onChange={(e) => setNewCustoBrindes(e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${darkMode ? 'bg-zinc-955 border-white/5 text-white' : 'bg-white border-slate-200'}`} placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Uniformes (R$)</label>
                          <input type="number" value={newCustoUniformes} onChange={(e) => setNewCustoUniformes(e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${darkMode ? 'bg-zinc-955 border-white/5 text-white' : 'bg-white border-slate-200'}`} placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Ingressos (R$)</label>
                          <input type="number" value={newCustoIngressos} onChange={(e) => setNewCustoIngressos(e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${darkMode ? 'bg-zinc-955 border-white/5 text-white' : 'bg-white border-slate-200'}`} placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Passagens (R$)</label>
                          <input type="number" value={newCustoPassagens} onChange={(e) => setNewCustoPassagens(e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${darkMode ? 'bg-zinc-955 border-white/5 text-white' : 'bg-white border-slate-200'}`} placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Hospedagem (R$)</label>
                          <input type="number" value={newCustoHospedagem} onChange={(e) => setNewCustoHospedagem(e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${darkMode ? 'bg-zinc-955 border-white/5 text-white' : 'bg-white border-slate-200'}`} placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Outros Custos (R$)</label>
                          <input type="number" value={newCustoOutros} onChange={(e) => setNewCustoOutros(e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${darkMode ? 'bg-zinc-955 border-white/5 text-white' : 'bg-white border-slate-200'}`} placeholder="0" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'Arquivos & Histórico' && (
                <div className="space-y-10 animate-fade-in">
              {/* === SECTION 5: Conteúdo e Documentos === */}
              <div className="space-y-5">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold">5</span>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-650 dark:text-zinc-300">Conteúdo e Documentos</h4>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Público Alvo</label>
                  <textarea
                    rows={2}
                    value={newTargetAudience}
                    onChange={(e) => setNewTargetAudience(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all resize-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Benefícios / Entregas</label>
                  <textarea
                    rows={3}
                    value={newBenefitsDeliverables}
                    onChange={(e) => setNewBenefitsDeliverables(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all resize-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Descrição Detalhada / Briefing</label>
                  <textarea
                    rows={4}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all resize-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Observações Internas</label>
                  <textarea
                    rows={3}
                    value={newInternalObservations}
                    onChange={(e) => setNewInternalObservations(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all resize-none ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Áreas Envolvidas (Separadas por vírgula)</label>
                  <input
                    value={newResponsibleAreas.join(', ')}
                    onChange={(e) => setNewResponsibleAreas(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Ex: Comercial, Marketing, Financeiro"
                    className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Links Úteis e Repositórios</label>
                  <textarea
                    rows={2}
                    value={newLinksAndRepos}
                    onChange={(e) => setNewLinksAndRepos(e.target.value)}
                    placeholder="Links para Drive, Notion, Trello, etc..."
                    className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all resize-none ${darkMode ? 'bg-zinc-950 border-white/5 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-600'}`}
                  />
                </div>
              </div>

                </div>
              )}
              </div>

              {/* Action Buttons Footer */}
              <div className="px-8 py-5 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-end space-x-3 rounded-b-[32px] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors ${
                    darkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md font-sans"
                >
                  {editingEventId ? 'Salvar Alterações' : 'Registrar Agenda'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Google Search Grounding Modal */}
      {isGoogleSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          <div 
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
            onClick={() => {
              if (!isSearchingGoogle) setIsGoogleSearchOpen(false);
            }}
          />

          <div className={`relative w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl border transform transition-all animate-spring-in z-30 ${
            darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-slate-200 text-zinc-900'
          }`}>
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200/40 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Globe className="h-5 w-5 text-indigo-500 animate-[spin_4s_linear_infinite]" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight font-display">Busca e Agendamento Inteligente Google</h3>
                  <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-zinc-400 dark:text-zinc-500 mt-0.5">Google Search Grounding Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setIsGoogleSearchOpen(false)}
                disabled={isSearchingGoogle}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content panel */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto w-full">
              
              {/* Informational advice */}
              <div className={`p-4 rounded-2xl text-[11px] leading-relaxed font-medium ${
                darkMode ? 'bg-zinc-950/40 text-zinc-400 border border-white/5' : 'bg-slate-50 text-zinc-600 border border-slate-200/50'
              }`}>
                O assistente consultará a internet em tempo real utilizando o **Google Search** para localizar dados corretos sobre feriados corporativos, pautas, conferências ou eventos em 2026.
              </div>

              {/* Search Query Input Code */}
              <form onSubmit={handleGoogleSearch} className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40 text-zinc-400" />
                  <input
                    type="text"
                    required
                    disabled={isSearchingGoogle}
                    placeholder="Ex: Feriado de Tiradentes 2026, Web Summit Rio 2026..."
                    value={googleSearchQuery}
                    onChange={(e) => setGoogleSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-24 py-3.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                      darkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                    } disabled:opacity-60`}
                  />
                  <button
                    type="submit"
                    disabled={isSearchingGoogle || !googleSearchQuery.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md"
                  >
                    {isSearchingGoogle ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </form>

              {/* Preset suggestion helpers */}
              {!googleSearchResult && !isSearchingGoogle && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">Exemplos Práticos</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Web Summit Rio 2026',
                      'Feriado Tiradentes 2026',
                      'Samba BH 2026',
                      'Black Friday 2026 Brasil',
                      'Feriado Consciência Negra 2026'
                    ].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setGoogleSearchQuery(term);
                          // Auto trigger search
                          setTimeout(() => {
                            handleGoogleSearch();
                          }, 100);
                        }}
                        className={`px-3 py-2 rounded-xl border text-[10px] font-semibold transition-all hover:scale-[1.02] active:scale-95 text-left ${
                          darkMode 
                            ? 'bg-zinc-950 border-white/5 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700' 
                            : 'bg-white border-slate-200 text-zinc-600 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading Anim block */}
              {isSearchingGoogle && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center w-full">
                  <div className="relative flex items-center justify-center h-14 w-14">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 dark:border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
                    <Globe className="h-6 w-6 text-indigo-500 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-display">Utilizando Grounding do Google Search</h4>
                    <p className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-relaxed mx-auto">
                      Cruzando fontes oficiais na internet para identificar datas precisas, descrições traduzidas, formatos sugeridos e coordenar seu expediente de 2026.
                    </p>
                  </div>
                </div>
              )}

              {/* Search Error box */}
              {googleSearchError && (
                <div className="flex items-start space-x-3 p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-800 dark:text-rose-400 text-[11px] w-full">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold font-display">Erro na Pesquisa</h5>
                    <p className="mt-0.5 opacity-90">{googleSearchError}</p>
                  </div>
                </div>
              )}

              {/* Real-time structured result preview block */}
              {googleSearchResult && !isSearchingGoogle && (
                <div className="space-y-4 pt-1 animate-spring-in w-full">
                  
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">Visualização do Evento Gerado</span>
                  
                  {/* Outer Event card copy mock */}
                  <div className={`rounded-2xl border p-5 ${
                    darkMode ? 'bg-zinc-950/50 border-indigo-500/20' : 'bg-slate-50 border-indigo-200'
                  } space-y-3.5 shadow-sm relative overflow-hidden`}>
                    
                    {/* Event header details */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className={`inline-block text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-indigo-505/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20`}>
                          {googleSearchResult.category === 'feriado_nacional' || googleSearchResult.category === 'feriado_bh' || googleSearchResult.category === 'feriado_sp' ? 'Feriado' : 'Evento'}
                        </span>
                        <h4 className="text-sm font-bold tracking-tight font-display pr-12">{googleSearchResult.title}</h4>
                      </div>
                      
                      {/* Formatted Date banner stamp */}
                      <div className="shrink-0 flex flex-col items-center justify-center h-12 w-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 shadow-sm rounded-xl">
                        <span className="text-[8px] font-bold text-indigo-500 uppercase leading-none">
                          {googleSearchResult.date ? new Date(googleSearchResult.date.split('-').map(Number)[0], googleSearchResult.date.split('-').map(Number)[1] - 1, googleSearchResult.date.split('-').map(Number)[2]).toLocaleDateString('pt-BR', { month: 'short' }).substring(0, 3).toUpperCase() : 'MAI'}
                        </span>
                        <span className="text-base font-bold text-zinc-900 dark:text-white leading-none mt-1">
                          {googleSearchResult.date ? googleSearchResult.date.split('-').map(Number)[2] : 16}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] leading-relaxed dark:text-zinc-300 text-zinc-600">
                      {googleSearchResult.description}
                    </p>

                    {/* Metadata line items block */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-white/5 text-[10px] font-medium text-zinc-550 dark:text-zinc-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{googleSearchResult.date} {googleSearchResult.time ? `às ${googleSearchResult.time}` : ''}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{googleSearchResult.location || 'Consultado'}</span>
                      </div>
                    </div>

                  </div>

                  {/* Grounding Source Info and Reasoning (Strict citation layout) */}
                  <div className={`p-4 rounded-2xl ${
                    darkMode ? 'bg-zinc-950/60 text-zinc-300 border border-white/5' : 'bg-zinc-105 text-zinc-700 border border-slate-200'
                  } space-y-2.5 text-[11px] w-full`}>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="text-[9px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">Análise Grounding do Google Search</span>
                    </div>
                    <p className="leading-relaxed font-semibold">
                      "{googleSearchResult.reasoning || 'Informação localizada com sucesso via indexador de eventos do Google.'}"
                    </p>
                    {googleSearchResult.source_url && (
                      <div className="pt-1 select-none">
                        <a 
                          href={googleSearchResult.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[9px] font-bold uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm"
                        >
                          <Globe className="h-3 w-3" />
                          <span>Abrir Link da Fonte</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions footer wrapper of suggestion */}
                  <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-end space-x-3 w-full">
                    <button
                      type="button"
                      onClick={() => setGoogleSearchResult(null)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                        darkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Pesquisar Outro
                    </button>
                    <button
                      type="button"
                      onClick={handleAddGoogleSearchResult}
                      className="px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md flex items-center space-x-1.5"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Confirmar & Agendar</span>
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className={`py-14 border-t transition-all relative z-10 ${
        darkMode ? 'border-white/5 bg-zinc-950/40 text-zinc-500' : 'border-slate-200 bg-slate-100/40 text-zinc-500'
      }`}>
        <div className="w-full px-6 lg:px-12 xl:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-300 font-display">Tripla Inc.</p>
            <p className="text-[10px] mt-1 font-medium opacity-65 leading-relaxed">Hub de informações centralizadas de sedes físicas em São Paulo, Belo Horizonte e equipes de trabalho remoto.</p>
          </div>
          <div className="flex space-x-6 text-[11px] font-semibold">
            <span className="hover:text-indigo-500 transition-colors cursor-pointer">Segurança de Dados</span>
            <span className="hover:text-indigo-500 transition-colors cursor-pointer">SLA de Operações</span>
            <span className="hover:text-indigo-500 transition-colors cursor-pointer font-black text-indigo-600 dark:text-indigo-400">Intranet</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

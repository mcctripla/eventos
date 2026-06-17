export type EventCategory =
  | 'interno'
  | 'comercial_tripla'
  | 'comercial_patrocinado'
  | 'feriado_nacional'
  | 'feriado_bh'
  | 'feriado_sp';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date format YYYY-MM-DD
  time?: string; // Optional time (HH:MM)
  category: EventCategory;
  location?: string; // Optional venue or meeting link
  isSystemHoliday?: boolean; // True if it's the fixed Brazilian calendar holiday
  reminderEnabled?: boolean;
  reminderType?: 'email' | 'push';
  reminderHoursBefore?: number;
}

export type CalendarView = 'cards' | 'timeline' | 'monthly' | 'weekly';

export interface CategoryInfo {
  id: EventCategory;
  label: string;
  color: string; // Tailwind bg color class
  textColor: string; // Tailwind text color class
  borderColor: string; // Tailwind border color class
  icon: string; // Lucide icon name
}

export const CATEGORIES: Record<EventCategory, CategoryInfo> = {
  interno: {
    id: 'interno',
    label: 'Interno',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: 'Users',
  },
  comercial_tripla: {
    id: 'comercial_tripla',
    label: 'Comercial Tripla',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: 'TrendingUp',
  },
  comercial_patrocinado: {
    id: 'comercial_patrocinado',
    label: 'Comercial Patrocinado',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    icon: 'Award',
  },
  feriado_nacional: {
    id: 'feriado_nacional',
    label: 'Feriado Nacional',
    color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    icon: 'Flag',
  },
  feriado_bh: {
    id: 'feriado_bh',
    label: 'Feriado Municipal BH',
    color: 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100',
    textColor: 'text-cyan-800',
    borderColor: 'border-cyan-200',
    icon: 'Building',
  },
  feriado_sp: {
    id: 'feriado_sp',
    label: 'Feriado Municipal SP',
    color: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
    textColor: 'text-rose-800',
    borderColor: 'border-rose-200',
    icon: 'Milestone',
  },
};

// Calendar & Scheduling Types

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'MATCH' | 'SCRIM' | 'TRAINING' | 'TOURNAMENT' | 'OTHER';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  opponent?: string;
  map?: string;
  notes?: string;
  vodLink?: string;
  matchId?: string;
  reminderMinutes?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CalendarMonth {
  year: number;
  month: number;
  events: CalendarEvent[];
}

export interface UpcomingMatch {
  id: string;
  opponent: string;
  date: string;
  time: string;
  type: 'SCRIM' | 'PREMIER' | 'OFICIAL' | 'TOURNAMENT';
  maps: string[];
  notes?: string;
}

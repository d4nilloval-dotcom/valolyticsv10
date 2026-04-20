import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarEvent } from '@/types/calendar';

interface CalendarState {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsByMonth: (year: number, month: number) => CalendarEvent[];
  getEventsByDate: (date: string) => CalendarEvent[];
  getUpcomingEvents: (limit?: number) => CalendarEvent[];
  getEventsByType: (type: CalendarEvent['type']) => CalendarEvent[];
  linkEventToMatch: (eventId: string, matchId: string) => void;
}

const STORAGE_KEY = 'valoanalytics_calendar_v1';

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],

      addEvent: (event) => {
        const newEvent: CalendarEvent = {
          ...event,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          events: [...state.events, newEvent].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        }));
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        }));
      },

      getEventsByMonth: (year, month) => {
        return get().events.filter((e) => {
          const date = new Date(e.date);
          return date.getFullYear() === year && date.getMonth() === month;
        });
      },

      getEventsByDate: (date) => {
        return get().events.filter((e) => e.date === date);
      },

      getUpcomingEvents: (limit = 5) => {
        const today = new Date().toISOString().split('T')[0];
        return get()
          .events.filter(
            (e) => e.date >= today && e.status !== 'CANCELLED'
          )
          .slice(0, limit);
      },

      getEventsByType: (type) => {
        return get().events.filter((e) => e.type === type);
      },

      linkEventToMatch: (eventId, matchId) => {
        get().updateEvent(eventId, { matchId });
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

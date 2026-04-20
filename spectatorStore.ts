import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuickNote, RoundSnapshot, SpectatorConfig } from '@/types/spectator';

interface SpectatorState {
  isActive: boolean;
  currentMatchId: string | null;
  currentRound: number;
  notes: QuickNote[];
  config: SpectatorConfig;
  snapshots: RoundSnapshot[];
  activateMode: (matchId: string) => void;
  deactivateMode: () => void;
  addNote: (note: Omit<QuickNote, 'id' | 'timestamp'>) => void;
  deleteNote: (noteId: string) => void;
  updateConfig: (updates: Partial<SpectatorConfig>) => void;
  addSnapshot: (snapshot: Omit<RoundSnapshot, 'notes'>) => void;
  getNotesByMatch: (matchId: string) => QuickNote[];
  getNotesByRound: (matchId: string, round: number) => QuickNote[];
  exportNotes: (matchId: string) => string;
}

const defaultConfig: SpectatorConfig = {
  autoSaveNotes: true,
  noteCategories: ['TACTIC', 'MISTAKE', 'GOOD_PLAY', 'CALL', 'OTHER'],
  showEconomy: true,
  showTimer: true,
  quickNoteShortcuts: {
    '1': 'ECO round - mala decisión',
    '2': 'Buen execute',
    '3': 'Problema de comunicación',
    '4': 'Overpeek',
  },
};

const STORAGE_KEY = 'valoanalytics_spectator_v1';

export const useSpectatorStore = create<SpectatorState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentMatchId: null,
      currentRound: 1,
      notes: [],
      config: defaultConfig,
      snapshots: [],

      activateMode: (matchId) => {
        set({
          isActive: true,
          currentMatchId: matchId,
          currentRound: 1,
        });
      },

      deactivateMode: () => {
        set({
          isActive: false,
          currentMatchId: null,
          currentRound: 1,
        });
      },

      addNote: (note) => {
        const newNote: QuickNote = {
          ...note,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        set((state) => ({
          notes: [...state.notes, newNote],
        }));
      },

      deleteNote: (noteId) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== noteId),
        }));
      },

      updateConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates },
        }));
      },

      addSnapshot: (snapshot) => {
        const newSnapshot: RoundSnapshot = {
          ...snapshot,
          notes: get().notes.filter(
            (n) => n.matchId === get().currentMatchId && n.round === snapshot.round
          ),
        };
        set((state) => ({
          snapshots: [...state.snapshots, newSnapshot],
        }));
      },

      getNotesByMatch: (matchId) => {
        return get().notes.filter((n) => n.matchId === matchId);
      },

      getNotesByRound: (matchId, round) => {
        return get().notes.filter((n) => n.matchId === matchId && n.round === round);
      },

      exportNotes: (matchId) => {
        const matchNotes = get().getNotesByMatch(matchId);
        return JSON.stringify(matchNotes, null, 2);
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

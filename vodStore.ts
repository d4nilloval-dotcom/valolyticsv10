import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VOD, VODTimestamp } from '@/types/vod';

interface VODState {
  vods: VOD[];
  addVOD: (vod: Omit<VOD, 'id' | 'createdAt'>) => void;
  updateVOD: (id: string, updates: Partial<VOD>) => void;
  deleteVOD: (id: string) => void;
  addTimestamp: (vodId: string, timestamp: Omit<VODTimestamp, 'id'>) => void;
  removeTimestamp: (vodId: string, timestampId: string) => void;
  getVODsByMatch: (matchId: string) => VOD[];
  getVODById: (id: string) => VOD | undefined;
  getTimestampsByType: (vodId: string, type: VODTimestamp['type']) => VODTimestamp[];
}

const STORAGE_KEY = 'valoanalytics_vods_v1';

export const useVODStore = create<VODState>()(
  persist(
    (set, get) => ({
      vods: [],

      addVOD: (vod) => {
        const newVOD: VOD = {
          ...vod,
          id: crypto.randomUUID(),
          timestamps: vod.timestamps || [],
          createdAt: Date.now(),
        };
        set((state) => ({
          vods: [...state.vods, newVOD],
        }));
      },

      updateVOD: (id, updates) => {
        set((state) => ({
          vods: state.vods.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        }));
      },

      deleteVOD: (id) => {
        set((state) => ({
          vods: state.vods.filter((v) => v.id !== id),
        }));
      },

      addTimestamp: (vodId, timestamp) => {
        const newTimestamp: VODTimestamp = {
          ...timestamp,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          vods: state.vods.map((v) =>
            v.id === vodId
              ? { ...v, timestamps: [...v.timestamps, newTimestamp] }
              : v
          ),
        }));
      },

      removeTimestamp: (vodId, timestampId) => {
        set((state) => ({
          vods: state.vods.map((v) =>
            v.id === vodId
              ? { ...v, timestamps: v.timestamps.filter((t) => t.id !== timestampId) }
              : v
          ),
        }));
      },

      getVODsByMatch: (matchId) => {
        return get().vods.filter((v) => v.matchId === matchId);
      },

      getVODById: (id) => {
        return get().vods.find((v) => v.id === id);
      },

      getTimestampsByType: (vodId, type) => {
        const vod = get().vods.find((v) => v.id === vodId);
        return vod?.timestamps.filter((t) => t.type === type) || [];
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

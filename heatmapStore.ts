import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HeatmapData, HeatmapPoint, HeatmapType } from '@/types/heatmap';

interface HeatmapState {
  heatmaps: HeatmapData[];
  addHeatmap: (heatmap: Omit<HeatmapData, 'id' | 'createdAt'>) => void;
  updateHeatmap: (id: string, updates: Partial<HeatmapData>) => void;
  deleteHeatmap: (id: string) => void;
  addPoint: (heatmapId: string, point: Omit<HeatmapPoint, 'count'>) => void;
  getHeatmapsByMap: (map: string) => HeatmapData[];
  getHeatmapsByType: (type: HeatmapType) => HeatmapData[];
  getHeatmapById: (id: string) => HeatmapData | undefined;
  aggregateHeatmap: (map: string, type: HeatmapType, matchIds?: string[]) => HeatmapData | null;
}

const STORAGE_KEY = 'valoanalytics_heatmaps_v1';

export const useHeatmapStore = create<HeatmapState>()(
  persist(
    (set, get) => ({
      heatmaps: [],

      addHeatmap: (heatmap) => {
        const newHeatmap: HeatmapData = {
          ...heatmap,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        };
        set((state) => ({
          heatmaps: [...state.heatmaps, newHeatmap],
        }));
      },

      updateHeatmap: (id, updates) => {
        set((state) => ({
          heatmaps: state.heatmaps.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }));
      },

      deleteHeatmap: (id) => {
        set((state) => ({
          heatmaps: state.heatmaps.filter((h) => h.id !== id),
        }));
      },

      addPoint: (heatmapId, point) => {
        set((state) => ({
          heatmaps: state.heatmaps.map((h) => {
            if (h.id !== heatmapId) return h;
            
            const existingPoint = h.points.find(
              (p) => Math.abs(p.x - point.x) < 0.05 && Math.abs(p.y - point.y) < 0.05
            );
            
            if (existingPoint) {
              return {
                ...h,
                points: h.points.map((p) =>
                  p === existingPoint
                    ? { ...p, count: p.count + 1, intensity: Math.min(1, p.intensity + 0.2) }
                    : p
                ),
              };
            }
            
            return {
              ...h,
              points: [...h.points, { ...point, count: 1 }],
            };
          }),
        }));
      },

      getHeatmapsByMap: (map) => {
        return get().heatmaps.filter((h) => h.map === map);
      },

      getHeatmapsByType: (type) => {
        return get().heatmaps.filter((h) => h.type === type);
      },

      getHeatmapById: (id) => {
        return get().heatmaps.find((h) => h.id === id);
      },

      aggregateHeatmap: (map, type, matchIds) => {
        const relevantHeatmaps = get().heatmaps.filter(
          (h) =>
            h.map === map &&
            h.type === type &&
            (!matchIds || matchIds.some((id) => h.matchIds.includes(id)))
        );

        if (relevantHeatmaps.length === 0) return null;

        const allPoints: HeatmapPoint[] = [];
        relevantHeatmaps.forEach((h) => {
          allPoints.push(...h.points);
        });

        // Aggregate points by proximity
        const aggregatedPoints: HeatmapPoint[] = [];
        allPoints.forEach((point) => {
          const existing = aggregatedPoints.find(
            (p) => Math.abs(p.x - point.x) < 0.05 && Math.abs(p.y - point.y) < 0.05
          );
          
          if (existing) {
            existing.count += point.count;
            existing.intensity = Math.min(1, existing.intensity + point.intensity * 0.3);
          } else {
            aggregatedPoints.push({ ...point });
          }
        });

        return {
          id: 'aggregated',
          map,
          type,
          points: aggregatedPoints,
          matchIds: matchIds || relevantHeatmaps.flatMap((h) => h.matchIds),
          createdAt: Date.now(),
        };
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

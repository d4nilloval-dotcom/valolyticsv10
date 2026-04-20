import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TeamComposition, DraftAnalysis } from '@/types/draft';

interface DraftState {
  compositions: TeamComposition[];
  addComposition: (comp: Omit<TeamComposition, 'id' | 'createdAt'>) => void;
  updateComposition: (id: string, updates: Partial<TeamComposition>) => void;
  deleteComposition: (id: string) => void;
  getCompositionsByMatch: (matchId: string) => TeamComposition[];
  getCompositionsByMap: (map: string) => TeamComposition[];
  getDraftAnalysis: () => DraftAnalysis;
  getAgentPickStats: () => { agent: string; picks: number; wins: number; winRate: number }[];
  getBestCompositions: (limit?: number) => TeamComposition[];
  getRivalBanPatterns: (rivalTeamId: string) => string[];
}

const STORAGE_KEY = 'valoanalytics_draft_v1';

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      compositions: [],

      addComposition: (comp) => {
        const newComp: TeamComposition = {
          ...comp,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        };
        set((state) => ({
          compositions: [...state.compositions, newComp],
        }));
      },

      updateComposition: (id, updates) => {
        set((state) => ({
          compositions: state.compositions.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteComposition: (id) => {
        set((state) => ({
          compositions: state.compositions.filter((c) => c.id !== id),
        }));
      },

      getCompositionsByMatch: (matchId) => {
        return get().compositions.filter((c) => c.matchId === matchId);
      },

      getCompositionsByMap: (map) => {
        return get().compositions.filter((c) => c.map === map);
      },

      getAgentPickStats: () => {
        const stats: Record<string, { picks: number; wins: number }> = {};
        
        get().compositions.forEach((comp) => {
          comp.ourAgents.forEach((agent) => {
            if (!stats[agent]) stats[agent] = { picks: 0, wins: 0 };
            stats[agent].picks++;
            if (comp.won) stats[agent].wins++;
          });
        });

        return Object.entries(stats)
          .map(([agent, data]) => ({
            agent,
            picks: data.picks,
            wins: data.wins,
            winRate: data.picks > 0 ? (data.wins / data.picks) * 100 : 0,
          }))
          .sort((a, b) => b.picks - a.picks);
      },

      getBestCompositions: (limit = 5) => {
        return get()
          .compositions.filter((c) => c.won)
          .sort((a, b) => b.roundsWon - a.roundsLost - (a.roundsWon - a.roundsLost))
          .slice(0, limit);
      },

      getDraftAnalysis: () => {
        const compositions = get().compositions;
        const agentStats = get().getAgentPickStats();

        // Calculate agent synergies
        const synergyMap: Record<string, { matches: number; wins: number }> = {};
        compositions.forEach((comp) => {
          const agents = comp.ourAgents.sort();
          for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
              const key = `${agents[i]}|${agents[j]}`;
              if (!synergyMap[key]) synergyMap[key] = { matches: 0, wins: 0 };
              synergyMap[key].matches++;
              if (comp.won) synergyMap[key].wins++;
            }
          }
        });

        const synergies = Object.entries(synergyMap)
          .filter(([, data]) => data.matches >= 3)
          .map(([key, data]) => ({
            agents: key.split('|') as [string, string],
            matches: data.matches,
            winRate: (data.wins / data.matches) * 100,
          }))
          .sort((a, b) => b.winRate - a.winRate);

        // Ban stats
        const banStats: Record<string, { bans: number; byUs: number; againstUs: number }> = {};
        compositions.forEach((comp) => {
          comp.ourBans?.forEach((agent) => {
            if (!banStats[agent]) banStats[agent] = { bans: 0, byUs: 0, againstUs: 0 };
            banStats[agent].bans++;
            banStats[agent].byUs++;
          });
          comp.theirBans?.forEach((agent) => {
            if (!banStats[agent]) banStats[agent] = { bans: 0, byUs: 0, againstUs: 0 };
            banStats[agent].bans++;
            banStats[agent].againstUs++;
          });
        });

        return {
          mostPickedAgents: agentStats.slice(0, 10) as any,
          mostBannedAgents: Object.entries(banStats)
            .map(([agent, data]) => ({
              agent,
              bans: data.bans,
              bannedByUs: data.byUs,
              bannedAgainstUs: data.againstUs,
              banRate: (data.bans / compositions.length) * 100,
            })) as any,
          bestCompositions: get().getBestCompositions() as any,
          worstCompositions: compositions
            .filter((c) => !c.won)
            .sort((a, b) => a.roundsWon - a.roundsLost - (b.roundsWon - b.roundsLost))
            .slice(0, 5) as any,
          agentSynergies: synergies.slice(0, 10) as any,
          agentCounters: [],
          rivalBanPatterns: {},
        };
      },

      getRivalBanPatterns: () => {
        // This would be integrated with rival store
        return [];
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

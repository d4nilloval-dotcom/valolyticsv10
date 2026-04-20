import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RivalTeam, RivalMatch, RivalPlayer, RivalTeamStats } from '@/types/rivals';

interface RivalState {
  rivalTeams: Record<string, RivalTeam>;
  
  // Actions
  addRivalTeam: (team: RivalTeam) => void;
  updateRivalTeam: (id: string, updates: Partial<RivalTeam>) => void;
  deleteRivalTeam: (id: string) => void;
  
  addMatch: (teamId: string, match: RivalMatch) => void;
  updateMatch: (teamId: string, matchId: string, updates: Partial<RivalMatch>) => void;
  deleteMatch: (teamId: string, matchId: string) => void;
  
  addPlayerToTeam: (teamId: string, player: RivalPlayer) => void;
  updatePlayer: (teamId: string, playerId: string, updates: Partial<RivalPlayer>) => void;
  deletePlayer: (teamId: string, playerId: string) => void;
  
  // Computed
  getRivalTeamsList: () => RivalTeam[];
  getRivalTeamById: (id: string) => RivalTeam | undefined;
  getRivalTeamStats: (teamId: string) => RivalTeamStats | null;
  getAllMatches: () => RivalMatch[];
  getMatchesByTeam: (teamId: string) => RivalMatch[];
  getMatchesByMap: (map: string) => RivalMatch[];
  getWinRateAgainstRival: (teamId: string) => number;
}

const STORAGE_KEY = 'valoanalytics_rivals_v1';

export const useRivalStore = create<RivalState>()(
  persist(
    (set, get) => ({
      rivalTeams: {},

      addRivalTeam: (team) => {
        set((state) => ({
          rivalTeams: {
            ...state.rivalTeams,
            [team.id]: team
          }
        }));
      },

      updateRivalTeam: (id, updates) => {
        set((state) => ({
          rivalTeams: {
            ...state.rivalTeams,
            [id]: { ...state.rivalTeams[id], ...updates, updatedAt: Date.now() }
          }
        }));
      },

      deleteRivalTeam: (id) => {
        set((state) => {
          const { [id]: _, ...remaining } = state.rivalTeams;
          return { rivalTeams: remaining };
        });
      },

      addMatch: (teamId, match) => {
        set((state) => {
          const team = state.rivalTeams[teamId];
          if (!team) return state;
          
          const updatedMatches = [...team.matches, match];
          const wins = updatedMatches.filter(m => m.won).length;
          const total = updatedMatches.length;
          
          return {
            rivalTeams: {
              ...state.rivalTeams,
              [teamId]: {
                ...team,
                matches: updatedMatches,
                winRateAgainstUs: total > 0 ? ((total - wins) / total) * 100 : 0,
                totalMatches: total,
                updatedAt: Date.now()
              }
            }
          };
        });
      },

      updateMatch: (teamId, matchId, updates) => {
        set((state) => {
          const team = state.rivalTeams[teamId];
          if (!team) return state;
          
          const updatedMatches = team.matches.map(m => 
            m.id === matchId ? { ...m, ...updates } : m
          );
          
          const wins = updatedMatches.filter(m => m.won).length;
          const total = updatedMatches.length;
          
          return {
            rivalTeams: {
              ...state.rivalTeams,
              [teamId]: {
                ...team,
                matches: updatedMatches,
                winRateAgainstUs: total > 0 ? ((total - wins) / total) * 100 : 0,
                totalMatches: total,
                updatedAt: Date.now()
              }
            }
          };
        });
      },

      deleteMatch: (teamId, matchId) => {
        set((state) => {
          const team = state.rivalTeams[teamId];
          if (!team) return state;
          
          const updatedMatches = team.matches.filter(m => m.id !== matchId);
          const wins = updatedMatches.filter(m => m.won).length;
          const total = updatedMatches.length;
          
          return {
            rivalTeams: {
              ...state.rivalTeams,
              [teamId]: {
                ...team,
                matches: updatedMatches,
                winRateAgainstUs: total > 0 ? ((total - wins) / total) * 100 : 0,
                totalMatches: total,
                updatedAt: Date.now()
              }
            }
          };
        });
      },

      addPlayerToTeam: (teamId, player) => {
        set((state) => {
          const team = state.rivalTeams[teamId];
          if (!team) return state;
          
          return {
            rivalTeams: {
              ...state.rivalTeams,
              [teamId]: {
                ...team,
                players: [...team.players, player],
                updatedAt: Date.now()
              }
            }
          };
        });
      },

      updatePlayer: (teamId, playerId, updates) => {
        set((state) => {
          const team = state.rivalTeams[teamId];
          if (!team) return state;
          
          return {
            rivalTeams: {
              ...state.rivalTeams,
              [teamId]: {
                ...team,
                players: team.players.map(p => 
                  p.id === playerId ? { ...p, ...updates } : p
                ),
                updatedAt: Date.now()
              }
            }
          };
        });
      },

      deletePlayer: (teamId, playerId) => {
        set((state) => {
          const team = state.rivalTeams[teamId];
          if (!team) return state;
          
          return {
            rivalTeams: {
              ...state.rivalTeams,
              [teamId]: {
                ...team,
                players: team.players.filter(p => p.id !== playerId),
                updatedAt: Date.now()
              }
            }
          };
        });
      },

      getRivalTeamsList: () => Object.values(get().rivalTeams),

      getRivalTeamById: (id) => get().rivalTeams[id],

      getRivalTeamStats: (teamId) => {
        const team = get().rivalTeams[teamId];
        if (!team) return null;

        const matches = team.matches;
        const wins = matches.filter(m => m.won).length;
        const losses = matches.length - wins;
        
        // Map stats
        const mapStatsMap: Record<string, { matches: number; wins: number; losses: number }> = {};
        matches.forEach(m => {
          if (!mapStatsMap[m.map]) {
            mapStatsMap[m.map] = { matches: 0, wins: 0, losses: 0 };
          }
          mapStatsMap[m.map].matches++;
          if (m.won) {
            mapStatsMap[m.map].wins++;
          } else {
            mapStatsMap[m.map].losses++;
          }
        });

        const mapStats = Object.entries(mapStatsMap).map(([map, stats]) => ({
          map,
          ...stats
        }));

        // Player stats
        const playerStatsMap: Record<string, { 
          name: string; 
          totalACS: number; 
          totalKD: number; 
          matches: number;
          agents: Record<string, number>;
        }> = {};

        matches.forEach(m => {
          m.theirPlayers.forEach(p => {
            if (!playerStatsMap[p.name]) {
              playerStatsMap[p.name] = { 
                name: p.name, 
                totalACS: 0, 
                totalKD: 0, 
                matches: 0,
                agents: {}
              };
            }
            playerStatsMap[p.name].totalACS += p.acs || 0;
            playerStatsMap[p.name].totalKD += p.kd || 0;
            playerStatsMap[p.name].matches++;
            if (p.agent) {
              playerStatsMap[p.name].agents[p.agent] = (playerStatsMap[p.name].agents[p.agent] || 0) + 1;
            }
          });
        });

        const playerStats = Object.values(playerStatsMap).map(p => {
          const dominantAgent = Object.entries(p.agents).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
          return {
            name: p.name,
            avgACS: p.matches > 0 ? p.totalACS / p.matches : 0,
            avgKD: p.matches > 0 ? p.totalKD / p.matches : 0,
            dominantAgent,
            matches: p.matches
          };
        });

        // Recent form (last 5 matches)
        const recentForm = matches
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map(m => m.won ? 'W' : 'L') as ('W' | 'L')[];

        return {
          teamId,
          teamName: team.name,
          totalMatches: matches.length,
          wins,
          losses,
          winRate: matches.length > 0 ? (wins / matches.length) * 100 : 0,
          avgScoreUs: matches.length > 0 ? matches.reduce((acc, m) => acc + m.scoreUs, 0) / matches.length : 0,
          avgScoreThem: matches.length > 0 ? matches.reduce((acc, m) => acc + m.scoreThem, 0) / matches.length : 0,
          mapStats,
          playerStats,
          recentForm
        };
      },

      getAllMatches: () => {
        return Object.values(get().rivalTeams).flatMap(t => t.matches);
      },

      getMatchesByTeam: (teamId) => {
        return get().rivalTeams[teamId]?.matches || [];
      },

      getMatchesByMap: (map) => {
        return Object.values(get().rivalTeams)
          .flatMap(t => t.matches)
          .filter(m => m.map === map);
      },

      getWinRateAgainstRival: (teamId) => {
        const team = get().rivalTeams[teamId];
        if (!team || team.matches.length === 0) return 0;
        const wins = team.matches.filter(m => m.won).length;
        return (wins / team.matches.length) * 100;
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ rivalTeams: state.rivalTeams })
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Match, Player, PlayerStats, MapStats, RosterPlayer, 
  ScoutingNote, MatchType, AgentRole, Round, EconomyStats 
} from '@/types';
import { AGENT_ROLES } from '@/types';

interface AppState {
  // Data
  matches: Record<string, Match>;
  players: Record<string, Player[]>;
  roster: RosterPlayer[];
  scoutingNotes: ScoutingNote[];
  
  // UI State
  activeMatchId: string | null;
  activeTab: string;
  filters: {
    matchType: MatchType | 'ALL';
    map: string;
    search: string;
    dateRange: { from: string | null; to: string | null };
  };
  
  // Actions
  addMatch: (match: Match) => void;
  updateMatch: (id: string, match: Partial<Match>) => void;
  deleteMatch: (id: string) => void;
  setPlayersForMatch: (matchId: string, players: Player[]) => void;
  addPlayerToMatch: (matchId: string, player: Player) => void;
  updatePlayerInMatch: (matchId: string, playerId: string, player: Partial<Player>) => void;
  removePlayerFromMatch: (matchId: string, playerId: string) => void;
  
  // Rounds
  setRoundsForMatch: (matchId: string, rounds: Round[]) => void;
  addRound: (matchId: string, round: Round) => void;
  updateRound: (matchId: string, roundNumber: number, updates: Partial<Round>) => void;
  removeRound: (matchId: string, roundNumber: number) => void;
  
  // Economy
  setEconomyStats: (matchId: string, stats: EconomyStats) => void;
  calculateEconomyStats: (matchId: string) => EconomyStats | null;
  
  // Roster
  addToRoster: (player: RosterPlayer) => void;
  removeFromRoster: (name: string) => void;
  updateRosterPlayer: (name: string, updates: Partial<RosterPlayer>) => void;
  
  // Scouting
  addScoutingNote: (note: ScoutingNote) => void;
  deleteScoutingNote: (id: string) => void;
  
  // UI
  setActiveMatchId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setFilters: (filters: Partial<AppState['filters']>) => void;
  
  // Computed
  getMatchesList: () => Match[];
  getFilteredMatches: () => Match[];
  getPlayerStats: (typeFilter?: MatchType | 'ALL') => PlayerStats[];
  getMapStats: (typeFilter?: MatchType | 'ALL') => MapStats[];
  getMatchById: (id: string) => Match | undefined;
  getPlayersForMatch: (id: string) => Player[];
}

const STORAGE_KEY = 'valoanalytics_pro_v1';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      matches: {},
      players: {},
      roster: [],
      scoutingNotes: [],
      activeMatchId: null,
      activeTab: 'dashboard',
      filters: {
        matchType: 'ALL',
        map: 'ALL',
        search: '',
        dateRange: { from: null, to: null }
      },

      // Match actions
      addMatch: (match) => {
        set((state) => ({
          matches: { ...state.matches, [match.id]: match },
          players: { ...state.players, [match.id]: [] }
        }));
      },

      updateMatch: (id, updates) => {
        set((state) => ({
          matches: {
            ...state.matches,
            [id]: { ...state.matches[id], ...updates, updatedAt: Date.now() }
          }
        }));
      },

      deleteMatch: (id) => {
        set((state) => {
          const { [id]: _, ...remainingMatches } = state.matches;
          const { [id]: __, ...remainingPlayers } = state.players;
          return {
            matches: remainingMatches,
            players: remainingPlayers,
            activeMatchId: state.activeMatchId === id ? null : state.activeMatchId
          };
        });
      },

      // Player actions
      setPlayersForMatch: (matchId, players) => {
        set((state) => ({
          players: { ...state.players, [matchId]: players }
        }));
      },

      addPlayerToMatch: (matchId, player) => {
        set((state) => ({
          players: {
            ...state.players,
            [matchId]: [...(state.players[matchId] || []), player]
          }
        }));
      },

      updatePlayerInMatch: (matchId, playerId, updates) => {
        set((state) => ({
          players: {
            ...state.players,
            [matchId]: state.players[matchId]?.map((p) =>
              p.id === playerId ? { ...p, ...updates } : p
            ) || []
          }
        }));
      },

      removePlayerFromMatch: (matchId, playerId) => {
        set((state) => ({
          players: {
            ...state.players,
            [matchId]: state.players[matchId]?.filter((p) => p.id !== playerId) || []
          }
        }));
      },

      // Round actions
      setRoundsForMatch: (matchId, rounds) => {
        set((state) => ({
          matches: {
            ...state.matches,
            [matchId]: { ...state.matches[matchId], rounds }
          }
        }));
      },

      addRound: (matchId, round) => {
        set((state) => {
          const currentRounds = state.matches[matchId]?.rounds || [];
          return {
            matches: {
              ...state.matches,
              [matchId]: {
                ...state.matches[matchId],
                rounds: [...currentRounds, round]
              }
            }
          };
        });
      },

      updateRound: (matchId, roundNumber, updates) => {
        set((state) => ({
          matches: {
            ...state.matches,
            [matchId]: {
              ...state.matches[matchId],
              rounds: state.matches[matchId]?.rounds?.map((r) =>
                r.roundNumber === roundNumber ? { ...r, ...updates } : r
              ) || []
            }
          }
        }));
      },

      removeRound: (matchId, roundNumber) => {
        set((state) => ({
          matches: {
            ...state.matches,
            [matchId]: {
              ...state.matches[matchId],
              rounds: state.matches[matchId]?.rounds?.filter((r) => r.roundNumber !== roundNumber) || []
            }
          }
        }));
      },

      // Economy actions
      setEconomyStats: (matchId, stats) => {
        set((state) => ({
          matches: {
            ...state.matches,
            [matchId]: { ...state.matches[matchId], economyStats: stats }
          }
        }));
      },

      calculateEconomyStats: (matchId) => {
        const match = get().matches[matchId];
        if (!match?.rounds) return null;

        const rounds = match.rounds;
        const ecoRounds = rounds.filter(r => r.buyType === 'ECO');
        const forceRounds = rounds.filter(r => r.buyType === 'FORCE');
        const fullBuyRounds = rounds.filter(r => r.buyType === 'FULL');

        const ecoWins = ecoRounds.filter(r => r.outcome === 'WIN').length;
        const forceWins = forceRounds.filter(r => r.outcome === 'WIN').length;
        const fullBuyWins = fullBuyRounds.filter(r => r.outcome === 'WIN').length;

        const totalSpent = rounds.reduce((acc, r) => acc + (3900 - r.economyUs), 0);
        const totalEarned = rounds.reduce((acc, r) => acc + r.economyUs, 0);

        // Calculate consecutive loss bonus
        const lossBonus: number[] = [];
        let consecutiveLosses = 0;
        rounds.forEach((r, i) => {
          if (i > 0 && rounds[i-1].outcome === 'LOSS') {
            consecutiveLosses++;
          } else {
            consecutiveLosses = r.outcome === 'LOSS' ? 1 : 0;
          }
          lossBonus.push(Math.min(consecutiveLosses * 500 + 1900, 2900));
        });

        const stats: EconomyStats = {
          totalSpent,
          totalEarned,
          ecoRounds: ecoRounds.length,
          forceRounds: forceRounds.length,
          fullBuyRounds: fullBuyRounds.length,
          ecoWinRate: ecoRounds.length > 0 ? (ecoWins / ecoRounds.length) * 100 : 0,
          forceWinRate: forceRounds.length > 0 ? (forceWins / forceRounds.length) * 100 : 0,
          fullBuyWinRate: fullBuyRounds.length > 0 ? (fullBuyWins / fullBuyRounds.length) * 100 : 0,
          avgEconomy: rounds.length > 0 ? totalEarned / rounds.length : 0,
          economyBreaks: rounds.filter(r => r.economyUs < 2000 && r.outcome === 'WIN').length,
          consecutiveLossBonus: lossBonus
        };

        get().setEconomyStats(matchId, stats);
        return stats;
      },

      // Roster actions
      addToRoster: (player) => {
        set((state) => ({
          roster: [...state.roster, player]
        }));
      },

      removeFromRoster: (name) => {
        set((state) => ({
          roster: state.roster.filter((p) => p.name !== name)
        }));
      },

      updateRosterPlayer: (name, updates) => {
        set((state) => ({
          roster: state.roster.map((p) =>
            p.name === name ? { ...p, ...updates } : p
          )
        }));
      },

      // Scouting actions
      addScoutingNote: (note) => {
        set((state) => ({
          scoutingNotes: [...state.scoutingNotes, note]
        }));
      },

      deleteScoutingNote: (id) => {
        set((state) => ({
          scoutingNotes: state.scoutingNotes.filter((n) => n.id !== id)
        }));
      },

      // UI actions
      setActiveMatchId: (id) => set({ activeMatchId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),

      // Computed getters
      getMatchesList: () => Object.values(get().matches),

      getFilteredMatches: () => {
        const { matches, filters } = get();
        let list = Object.values(matches);

        if (filters.matchType !== 'ALL') {
          list = list.filter((m) => m.type === filters.matchType);
        }

        if (filters.map !== 'ALL') {
          list = list.filter((m) => m.map === filters.map);
        }

        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter((m) =>
            m.id.toLowerCase().includes(q) ||
            m.map.toLowerCase().includes(q)
          );
        }

        if (filters.dateRange.from) {
          list = list.filter((m) => m.date >= filters.dateRange.from!);
        }

        if (filters.dateRange.to) {
          list = list.filter((m) => m.date <= filters.dateRange.to!);
        }

        return list.sort((a, b) => b.createdAt - a.createdAt);
      },

      getMatchById: (id) => get().matches[id],

      getPlayersForMatch: (id) => get().players[id] || [],

      getPlayerStats: (typeFilter = 'ALL') => {
        const { matches, players } = get();
        const agg: Record<string, {
          name: string;
          matches: number;
          rounds: number;
          k: number;
          d: number;
          a: number;
          kastSum: number;
          kastN: number;
          acsSum: number;
          fk: number;
          fd: number;
          plants: number;
          defuses: number;
          wins: number;
          agentPool: Record<string, number>;
          rolePool: Record<string, number>;
        }> = {};

        for (const [matchId, playerList] of Object.entries(players)) {
          const match = matches[matchId];
          if (!match) continue;
          if (typeFilter !== 'ALL' && match.type !== typeFilter) continue;

          const rounds = match.scoreUs + match.scoreOpp + match.otWin + match.otLoss;

          for (const p of playerList) {
            if (!p.name) continue;

            if (!agg[p.name]) {
              agg[p.name] = {
                name: p.name,
                matches: 0,
                rounds: 0,
                k: 0, d: 0, a: 0,
                kastSum: 0, kastN: 0,
                acsSum: 0,
                fk: 0, fd: 0,
                plants: 0, defuses: 0,
                wins: 0,
                agentPool: {},
                rolePool: {}
              };
            }

            const a = agg[p.name];
            a.matches++;
            a.rounds += rounds;
            a.k += p.k;
            a.d += p.d;
            a.a += p.a;
            a.fk += p.fk;
            a.fd += p.fd;
            a.plants += p.plants;
            a.defuses += p.defuses;
            if (match.won) a.wins++;

            if (p.kast > 0) {
              a.kastSum += p.kast;
              a.kastN++;
            }
            a.acsSum += p.acs;

            if (p.agent) {
              a.agentPool[p.agent] = (a.agentPool[p.agent] || 0) + 1;
              const role = AGENT_ROLES[p.agent] || 'Unknown';
              a.rolePool[role] = (a.rolePool[role] || 0) + 1;
            }
          }
        }

        return Object.values(agg).map((x) => {
          const kd = x.d === 0 ? x.k : x.k / x.d;
          const kastAvg = x.kastN ? x.kastSum / x.kastN : 0;
          const acsAvg = x.matches ? x.acsSum / x.matches : 0;
          const winRate = x.matches ? (x.wins / x.matches) * 100 : 0;

          // Calculate dominant agent and role
          const dominantAgent = Object.entries(x.agentPool)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
          const dominantRole = Object.entries(x.rolePool)
            .sort((a, b) => b[1] - a[1])[0]?.[0] as AgentRole || 'Unknown';

          // Calculate rating (VLR-like formula)
          // VLR.gg formula approx: 1.0 = average, can exceed with good performance
          
          const fkNet = x.fk - x.fd;
          const fkPerRound = x.rounds > 0 ? x.fk / x.rounds : 0;
          
          // Impact score: FK per round weighted by FK/FD ratio
          const fkFdRatio = x.fd > 0 ? x.fk / x.fd : x.fk > 0 ? 2 : 1;
          const impactScore = fkPerRound * Math.min(fkFdRatio, 2) * 50;
          
          // Normalize each component (1.0 = average performance)
          const kastComponent = (kastAvg / 70) * 0.25;
          const kdComponent = (Math.min(kd, 2) / 1.0) * 0.25;
          const acsComponent = (acsAvg / 200) * 0.25;
          const impactComponent = Math.min(impactScore, 0.25);
          
          const rating = 0.7 + kastComponent + kdComponent + acsComponent + impactComponent;

          return {
            name: x.name,
            matches: x.matches,
            rounds: x.rounds,
            maps: x.matches,
            k: x.k, d: x.d, a: x.a,
            kd,
            kastAvg,
            acsAvg,
            fk: x.fk, fd: x.fd,
            fkNet,
            plants: x.plants,
            defuses: x.defuses,
            rating: Math.round(rating * 100) / 100, // 2 decimal places like VLR
            winRate,
            avgKills: x.k / x.matches,
            avgDeaths: x.d / x.matches,
            avgAssists: x.a / x.matches,
            consistency: kastAvg,
            impact: fkPerRound * Math.min(fkFdRatio, 2),
            entry: fkNet,
            agentPool: x.agentPool,
            dominantRole,
            dominantAgent
          };
        });
      },

      getMapStats: (typeFilter = 'ALL') => {
        const { matches } = get();
        const agg: Record<string, {
          map: string;
          matches: number;
          wins: number;
          pistAtkW: number;
          pistDefW: number;
          postW: number;
          postL: number;
          rtW: number;
          rtL: number;
          otW: number;
          otL: number;
          atkSum: number;
          defSum: number;
          scoreUsSum: number;
          scoreOppSum: number;
        }> = {};

        for (const m of Object.values(matches)) {
          if (typeFilter !== 'ALL' && m.type !== typeFilter) continue;

          if (!agg[m.map]) {
            agg[m.map] = {
              map: m.map,
              matches: 0,
              wins: 0,
              pistAtkW: 0,
              pistDefW: 0,
              postW: 0,
              postL: 0,
              rtW: 0,
              rtL: 0,
              otW: 0,
              otL: 0,
              atkSum: 0,
              defSum: 0,
              scoreUsSum: 0,
              scoreOppSum: 0
            };
          }

          const a = agg[m.map];
          a.matches++;
          if (m.won) a.wins++;
          if (m.pistolAtkWin) a.pistAtkW++;
          if (m.pistolDefWin) a.pistDefW++;
          a.postW += m.postWin;
          a.postL += m.postLoss;
          a.rtW += m.retakeWin;
          a.rtL += m.retakeLoss;
          a.otW += m.otWin;
          a.otL += m.otLoss;
          a.atkSum += m.atk;
          a.defSum += m.def;
          a.scoreUsSum += m.scoreUs;
          a.scoreOppSum += m.scoreOpp;
        }

        return Object.values(agg).map((a) => ({
          ...a,
          losses: a.matches - a.wins,
          winPct: a.matches ? (a.wins / a.matches) * 100 : 0,
          pistAtkPct: a.matches ? (a.pistAtkW / a.matches) * 100 : 0,
          pistDefPct: a.matches ? (a.pistDefW / a.matches) * 100 : 0,
          postPct: (a.postW + a.postL) > 0 ? (a.postW / (a.postW + a.postL)) * 100 : 0,
          rtPct: (a.rtW + a.rtL) > 0 ? (a.rtW / (a.rtW + a.rtL)) * 100 : 0,
          otPct: (a.otW + a.otL) > 0 ? (a.otW / (a.otW + a.otL)) * 100 : 0,
          atkAvg: a.matches ? a.atkSum / a.matches : 0,
          defAvg: a.matches ? a.defSum / a.matches : 0,
          avgScoreUs: a.matches ? a.scoreUsSum / a.matches : 0,
          avgScoreOpp: a.matches ? a.scoreOppSum / a.matches : 0
        }));
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        matches: state.matches,
        players: state.players,
        roster: state.roster,
        scoutingNotes: state.scoutingNotes
      })
    }
  )
);

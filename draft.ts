// Draft / Pick-Ban Analyzer Types

export type DraftPhase = 'BAN_1' | 'PICK_1' | 'BAN_2' | 'PICK_2' | 'BAN_3' | 'PICK_3';

export interface DraftAction {
  id: string;
  phase: DraftPhase;
  type: 'BAN' | 'PICK';
  agent: string;
  team: 'US' | 'THEM';
  order: number;
}

export interface TeamComposition {
  id: string;
  matchId: string;
  map: string;
  side: 'ATK' | 'DEF';
  ourAgents: string[];
  theirAgents: string[];
  ourBans: string[];
  theirBans: string[];
  won: boolean;
  roundsWon: number;
  roundsLost: number;
  notes?: string;
  createdAt: number;
}

export interface CompositionStats {
  agents: string[];
  map: string;
  side: 'ATK' | 'DEF';
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgRoundsWon: number;
  avgRoundsLost: number;
}

export interface AgentPickStats {
  agent: string;
  picks: number;
  wins: number;
  losses: number;
  winRate: number;
  avgACS: number;
  byMap: { [map: string]: { picks: number; wins: number } };
}

export interface AgentBanStats {
  agent: string;
  bans: number;
  bannedByUs: number;
  bannedAgainstUs: number;
  banRate: number;
}

export interface DraftAnalysis {
  mostPickedAgents: AgentPickStats[];
  mostBannedAgents: AgentBanStats[];
  bestCompositions: CompositionStats[];
  worstCompositions: CompositionStats[];
  agentSynergies: { agents: [string, string]; matches: number; winRate: number }[];
  agentCounters: { agent: string; counter: string; matches: number; winRate: number }[];
  rivalBanPatterns: { [rivalTeamId: string]: string[] };
}

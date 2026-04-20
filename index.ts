// Valorant Analytics Pro - Type Definitions

export type MatchType = 'SCRIM' | 'PREMIER' | 'OFICIAL' | 'TOURNAMENT' | 'CUSTOM';
export type AgentRole = 'Duelist' | 'Controller' | 'Initiator' | 'Sentinel' | 'Unknown';

export type BuyType = 'ECO' | 'FORCE' | 'FULL' | 'OVERTIME';
export type RoundOutcome = 'WIN' | 'LOSS' | 'DRAW';
export type Side = 'ATK' | 'DEF';

export interface Round {
  roundNumber: number;
  side: Side;
  outcome: RoundOutcome;
  buyType: BuyType;
  opponentBuyType?: BuyType;
  killsUs: number;
  killsOpp: number;
  bombPlanted: boolean;
  bombDefused: boolean;
  clutchWon?: boolean;
  clutchSituation?: string;
  keyMoments?: string[];
  economyUs: number;
  economyOpp: number;
  notes?: string;
}

export interface EconomyStats {
  totalSpent: number;
  totalEarned: number;
  ecoRounds: number;
  forceRounds: number;
  fullBuyRounds: number;
  ecoWinRate: number;
  forceWinRate: number;
  fullBuyWinRate: number;
  avgEconomy: number;
  economyBreaks: number;
  consecutiveLossBonus: number[];
}

export interface Match {
  id: string;
  type: MatchType;
  map: string;
  date: string;
  atk: number;
  def: number;
  scoreUs: number;
  scoreOpp: number;
  otWin: number;
  otLoss: number;
  won: boolean;
  pistolAtkWin: boolean;
  pistolDefWin: boolean;
  postWin: number;
  postLoss: number;
  retakeWin: number;
  retakeLoss: number;
  notes?: string;
  rounds?: Round[];
  economyStats?: EconomyStats;
  createdAt: number;
  updatedAt: number;
}

export interface Player {
  id: string;
  name: string;
  agent: string;
  role: AgentRole;
  k: number;
  d: number;
  a: number;
  kast: number;
  fk: number;
  fd: number;
  acs: number;
  plants: number;
  defuses: number;
  adr?: number;
  hsPercent?: number;
  clutchWon?: number;
  clutchLost?: number;
  multiKills?: number;
}

export interface PlayerMatchData {
  matchId: string;
  playerId: string;
  player: Player;
}

export interface PlayerStats {
  name: string;
  matches: number;
  rounds: number;
  maps: number;
  k: number;
  d: number;
  a: number;
  kd: number;
  kastAvg: number;
  acsAvg: number;
  fk: number;
  fd: number;
  fkNet: number;
  plants: number;
  defuses: number;
  rating: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  consistency: number;
  impact: number;
  entry: number;
  agentPool: { [agent: string]: number };
  dominantRole: AgentRole;
  dominantAgent: string;
}

export interface MapStats {
  map: string;
  matches: number;
  wins: number;
  losses: number;
  winPct: number;
  pistAtkW: number;
  pistAtkPct: number;
  pistDefW: number;
  pistDefPct: number;
  postW: number;
  postL: number;
  postPct: number;
  rtW: number;
  rtL: number;
  rtPct: number;
  otW: number;
  otL: number;
  otPct: number;
  atkAvg: number;
  defAvg: number;
  avgScoreUs: number;
  avgScoreOpp: number;
}

export interface DashboardKPI {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export interface RadarData {
  axes: number[];
  labels: string[];
  breakdown: {
    raw: {
      acsAvg: number;
      kd: number;
      kastAvg: number;
      fk: number;
      fd: number;
      fkNet: number;
      aPer: number;
      plantsPer: number;
      defusesPer: number;
      objPer: number;
      matches: number;
      rounds: number;
    };
    pctl: {
      acsP: number;
      kdP: number;
      kastP: number;
      fkNetP: number;
      aPerP: number;
      objP: number;
    };
    role: AgentRole;
    agent: string;
    norm: string;
    scopeN: number;
  };
}

export interface RosterPlayer {
  name: string;
  aliases: string[];
  role?: AgentRole;
  mainAgents?: string[];
}

export interface ScoutingNote {
  id: string;
  playerName: string;
  matchId?: string;
  date: string;
  content: string;
  tags: string[];
  rating: number;
}

export interface TeamComposition {
  id: string;
  name: string;
  agents: string[];
  map: string;
  side: 'ATK' | 'DEF';
  winRate: number;
  matches: number;
}

export interface PerformanceTrend {
  date: string;
  rating: number;
  acs: number;
  kd: number;
  kast: number;
  result: 'win' | 'loss';
}

export interface ComparisonData {
  player1: PlayerStats;
  player2: PlayerStats;
  radar1: RadarData;
  radar2: RadarData;
}

export const VALORANT_MAPS = [
  'Ascent', 'Bind', 'Haven', 'Split', 'Pearl', 
  'Breeze', 'Abyss', 'Corrode', 'Lotus', 'Fracture', 
  'Icebox', 'Sunset'
] as const;

export const VALORANT_AGENTS = [
  // Duelists
  'Jett', 'Raze', 'Reyna', 'Phoenix', 'Yoru', 'Neon', 'Iso', 'Waylay',
  // Controllers
  'Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove',
  // Initiators
  'Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko', 'Tejo',
  // Sentinels
  'Sage', 'Cypher', 'Killjoy', 'Chamber', 'Deadlock', 'Veto'
] as const;

export const AGENT_ROLES: Record<string, AgentRole> = {
  Jett: 'Duelist', Raze: 'Duelist', Reyna: 'Duelist', Phoenix: 'Duelist',
  Yoru: 'Duelist', Neon: 'Duelist', Iso: 'Duelist', Waylay: 'Duelist',
  Brimstone: 'Controller', Omen: 'Controller', Viper: 'Controller',
  Astra: 'Controller', Harbor: 'Controller', Clove: 'Controller',
  Sova: 'Initiator', Breach: 'Initiator', Skye: 'Initiator',
  'KAY/O': 'Initiator', Fade: 'Initiator', Gekko: 'Initiator', Tejo: 'Initiator',
  Sage: 'Sentinel', Cypher: 'Sentinel', Killjoy: 'Sentinel',
  Chamber: 'Sentinel', Deadlock: 'Sentinel', Veto: 'Sentinel'
};

export const RADAR_AXES = ['Firepower', 'Entry', 'Consistency', 'Teamplay', 'Objective'] as const;

// Spectator Mode Types for Coaches

export interface LiveMatchState {
  matchId: string;
  currentRound: number;
  scoreUs: number;
  scoreThem: number;
  side: 'ATK' | 'DEF';
  economyUs: number;
  economyThem: number;
  roundTime: number;
  spikePlanted: boolean;
  spikeSite?: 'A' | 'B' | 'C';
}

export interface QuickNote {
  id: string;
  matchId: string;
  round: number;
  timestamp: number;
  category: 'TACTIC' | 'MISTAKE' | 'GOOD_PLAY' | 'CALL' | 'OTHER';
  content: string;
  player?: string;
}

export interface SpectatorConfig {
  autoSaveNotes: boolean;
  noteCategories: string[];
  showEconomy: boolean;
  showTimer: boolean;
  quickNoteShortcuts: { [key: string]: string };
}

export interface RoundSnapshot {
  round: number;
  scoreUs: number;
  scoreThem: number;
  economyUs: number;
  economyThem: number;
  buyUs: string;
  buyThem: string;
  notes: QuickNote[];
}

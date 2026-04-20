// Types for rival team analysis

export interface RivalPlayer {
  id: string;
  name: string;
  agent?: string;
  role?: string;
  acs?: number;
  kd?: number;
  kast?: number;
  fk?: number;
  fd?: number;
  adr?: number;
  hsPercent?: number;
  notes?: string;
}

export interface RivalMatch {
  id: string;
  rivalTeamId: string;
  date: string;
  map: string;
  scoreUs: number;
  scoreThem: number;
  won: boolean;
  type: 'SCRIM' | 'PREMIER' | 'OFICIAL' | 'TOURNAMENT';
  ourPlayers: RivalPlayer[];
  theirPlayers: RivalPlayer[];
  notes?: string;
  vodLink?: string;
  createdAt: number;
}

export interface RivalTeam {
  id: string;
  name: string;
  tag?: string;
  region?: string;
  tier?: 'T1' | 'T2' | 'T3' | 'AMATEUR';
  logo?: string;
  players: RivalPlayer[];
  matches: RivalMatch[];
  notes?: string;
  winRateAgainstUs: number;
  totalMatches: number;
  createdAt: number;
  updatedAt: number;
}

export interface RivalTeamStats {
  teamId: string;
  teamName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgScoreUs: number;
  avgScoreThem: number;
  mapStats: {
    map: string;
    matches: number;
    wins: number;
    losses: number;
  }[];
  playerStats: {
    name: string;
    avgACS: number;
    avgKD: number;
    dominantAgent: string;
    matches: number;
  }[];
  recentForm: ('W' | 'L')[];
}

// VOD (Video on Demand) Types

export interface VODTimestamp {
  id: string;
  time: number;
  label: string;
  type: 'ROUND_START' | 'ROUND_END' | 'KILL' | 'CLUTCH' | 'ECO_WIN' | 'EXECUTE' | 'CUSTOM';
  round?: number;
  description?: string;
}

export interface VOD {
  id: string;
  matchId: string;
  title: string;
  url: string;
  platform: 'YOUTUBE' | 'TWITCH' | 'CLOUD' | 'LOCAL';
  duration?: number;
  timestamps: VODTimestamp[];
  notes?: string;
  uploadedAt: number;
  createdAt: number;
}

export interface VODAnalysis {
  vodId: string;
  matchId: string;
  keyMoments: VODTimestamp[];
  roundTimestamps: { round: number; startTime: number; endTime: number }[];
  taggedPlayers: { playerName: string; timestamps: number[] }[];
}

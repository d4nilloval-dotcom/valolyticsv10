// Heatmap Types

export type HeatmapType = 'KILLS' | 'DEATHS' | 'UTILITY' | 'POSITIONING' | 'ROTATIONS';

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  count: number;
  details?: {
    player?: string;
    agent?: string;
    round?: number;
    timestamp?: number;
    description?: string;
  };
}

export interface HeatmapData {
  id: string;
  map: string;
  type: HeatmapType;
  side?: 'ATK' | 'DEF';
  agent?: string;
  player?: string;
  points: HeatmapPoint[];
  matchIds: string[];
  createdAt: number;
}

export interface HeatmapZone {
  id: string;
  map: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  kills: number;
  deaths: number;
  winRate: number;
  commonAgents: string[];
}

export interface PositionAnalysis {
  map: string;
  commonAttackPositions: HeatmapZone[];
  commonDefensePositions: HeatmapZone[];
  rotationPaths: { from: string; to: string; frequency: number }[];
  highKillZones: HeatmapZone[];
  highDeathZones: HeatmapZone[];
}

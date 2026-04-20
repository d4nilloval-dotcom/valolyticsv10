// Advanced Analytics Types - Pro Level Features

// 1. Win Probability Model
export interface WinProbabilityState {
  round: number;
  economyUs: number;
  economyThem: number;
  playersAliveUs: number;
  playersAliveThem: number;
  spikePlanted: boolean;
  spikeSite?: 'A' | 'B' | 'C';
  utilityUs: number; // 0-100
  utilityThem: number;
  mapControlUs: number; // 0-100
  mapControlThem: number;
}

export interface WinProbabilityResult {
  probabilityUs: number; // 0-100
  probabilityThem: number;
  confidence: number; // 0-1
  factors: {
    economyWeight: number;
    numbersWeight: number;
    utilityWeight: number;
    mapControlWeight: number;
    spikeWeight: number;
  };
}

// 2. Conversion Tracker
export interface ConversionStats {
  afterFirstKill: {
    total: number;
    converted: number;
    rate: number;
  };
  afterAdvantage5v4: {
    total: number;
    converted: number;
    rate: number;
  };
  afterSpikePlanted: {
    total: number;
    won: number;
    rate: number;
  };
  after2PlusAdvantage: {
    total: number;
    converted: number;
    rate: number;
  };
  antiThrowIndex: number; // 0-100, higher is better
}

// 3. Utility Efficiency
export interface UtilityEfficiency {
  playerName: string;
  flashes: {
    thrown: number;
    enemiesFlashed: number;
    avgFlashDuration: number;
    flashAssists: number;
    efficiencyScore: number;
  };
  recon: {
    thrown: number;
    enemiesSpotted: number;
    detectionRate: number;
  };
  smokes: {
    thrown: number;
    effectiveBlocks: number; // blocked LOS
    decorativeBlocks: number; // ineffective
    effectiveness: number;
  };
  mollies: {
    thrown: number;
    damageDealt: number;
    zoneDenialTime: number;
  };
  overallWasted: number; // percentage
  utilityImpactScore: number; // 0-100
}

// 4. Clutch Profile
export interface ClutchProfile {
  playerName: string;
  totalClutches: number;
  wonClutches: number;
  winRate: number;
  avgDecisionTime: number; // seconds
  commonPositions: { site: string; count: number }[];
  postPlantWinRate: number;
  retakeWinRate: number;
  utilityUsageInClutch: number; // percentage
  winRateByMap: { map: string; clutches: number; wins: number }[];
  clutchRating: number; // 0-100
}

// 5. Anti-Strat Patterns
export interface RivalPatterns {
  teamId: string;
  teamName: string;
  pistolRounds: {
    atkWins: number;
    defWins: number;
    commonStrategy: string;
  };
  afterTimeout: {
    roundsAfter: number;
    wins: number;
    winRate: number;
    commonChange: string;
  };
  stackPatterns: {
    site: string;
    frequency: number;
    successRate: number;
  }[];
  defaultPatterns: {
    map: string;
    defaultType: string;
    frequency: number;
  }[];
  lurkPatterns: {
    player: string;
    frequency: number;
    successRate: number;
    commonPosition: string;
  }[];
  predictions: {
    scenario: string;
    probability: number;
    recommendation: string;
  }[];
}

// 6. Adaptability Index
export interface AdaptabilityMetrics {
  playerName: string;
  firstEncounterWinRate: number;
  rematchWinRate: number;
  afterCompChange: {
    matches: number;
    wins: number;
    adaptationSpeed: number; // rounds to adapt
  };
  afterLosingStreak3: {
    occurrences: number;
    recoveryRate: number; // win next round
  };
  afterTimeout: {
    roundsAfter: number;
    wins: number;
    impact: number; // positive/negative
  };
  adaptabilityScore: number; // 0-100
}

// 7. Entry System
export interface EntryAnalysis {
  playerName: string;
  entryAttempts: number;
  entrySuccess: number; // first kill
  entryDeaths: number;
  entrySuccessRate: number;
  tradeEfficiency: number; // traded when dying
  entryWithUtility: {
    attempts: number;
    success: number;
    rate: number;
  };
  entryWithoutUtility: {
    attempts: number;
    success: number;
    rate: number;
  };
  defaultEntry: {
    attempts: number;
    success: number;
  };
  executeEntry: {
    attempts: number;
    success: number;
  };
  entryRating: number; // 0-100
}

// 8. Economy Impact
export interface EconomyDecision {
  round: number;
  decision: 'FORCE' | 'ECO' | 'FULL';
  ourEconomy: number;
  theirEconomy: number;
  outcome: 'WIN' | 'LOSS';
  impactNext3Rounds: number; // economic impact
  expectedValue: number;
  actualValue: number;
}

export interface EconomyImpact {
  forceDecisions: EconomyDecision[];
  ecoStackSuccess: number; // win rate on eco
  forceWinRate: number;
  fullBuyWinRate: number;
  economicEfficiency: number; // 0-100
  recommendedStrategy: string;
}

// 9. Duo Synergy
export interface DuoSynergy {
  player1: string;
  player2: string;
  matchesTogether: number;
  winRateTogether: number;
  tradeRate: number; // trades per round
  combinedACS: number;
  postPlantSuccess: number;
  clutchTogetherRate: number;
  synergyScore: number; // 0-100
  recommended: boolean;
}

// 10. Momentum
export interface MomentumPoint {
  round: number;
  scoreUs: number;
  scoreThem: number;
  winProbability: number;
  keyEvent?: string;
  momentumShift: number; // -100 to 100
}

export interface MomentumAnalysis {
  matchId: string;
  points: MomentumPoint[];
  keyRounds: {
    round: number;
    description: string;
    impact: number;
  }[];
  timeoutEffectiveness: {
    timeoutRound: number;
    roundsWonAfter: number;
    impact: number;
  }[];
  comebackPotential: number; // 0-100
}

// 11. Round Timeline Events
export interface RoundTimelineEvent {
  time: number; // seconds from round start
  type: 'UTILITY' | 'KILL' | 'SPIKE_PLANT' | 'SPIKE_DEFUSE' | 'ROTATION' | 'CALL';
  player?: string;
  agent?: string;
  description: string;
  impact: number; // -10 to 10
}

export interface RoundTimeline {
  round: number;
  events: RoundTimelineEvent[];
  keyMoments: string[];
  winningPlay: string;
  losingMistake: string;
}

// 12. Win Conditions
export interface WinCondition {
  condition: string;
  description: string;
  winRate: number;
  sampleSize: number;
  confidence: number;
  recommendation: string;
}

export interface WinConditionProfile {
  teamLevel: 'SLOW_START' | 'FAST_AGGRESSIVE' | 'UTILITY_HEAVY' | 'AIM_DUEL' | 'ADAPTIVE';
  optimalPace: number; // seconds to execute
  bestMaps: string[];
  worstMaps: string[];
  preferredSide: 'ATK' | 'DEF';
  winConditions: WinCondition[];
  avoidConditions: string[];
}

// 13. Site Control Intelligence
export interface SiteControlStats {
  map: string;
  site: 'A' | 'B' | 'C';
  avgControlTime: number; // seconds
  fakeSuccessRate: number;
  avgRotationTime: number;
  overRotationRate: number;
  commonExecutes: string[];
  defenseWeaknesses: string[];
}

// 14. Consistency & Variance
export interface ConsistencyMetrics {
  playerName: string;
  acsStdDev: number;
  kdVariance: number;
  impactStability: number; // 0-100
  performanceByMap: { map: string; consistency: number }[];
  coinflipIndex: number; // 0-100, higher = more inconsistent
  reliabilityRating: 'ROCK_SOLID' | 'CONSISTENT' | 'VARIABLE' | 'COINFLIP';
}

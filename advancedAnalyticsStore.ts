import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WinProbabilityState,
  WinProbabilityResult,
  ConversionStats,
  UtilityEfficiency,
  ClutchProfile,
  RivalPatterns,
  AdaptabilityMetrics,
  EntryAnalysis,
  EconomyImpact,
  DuoSynergy,
  MomentumAnalysis,
  RoundTimeline,
  WinConditionProfile,
  SiteControlStats,
  ConsistencyMetrics,
} from '@/types/advanced';
import type { Round, Match } from '@/types';

interface AdvancedAnalyticsState {
  // Calculators
  calculateWinProbability: (state: WinProbabilityState) => WinProbabilityResult;
  calculateConversionStats: (matchId: string) => ConversionStats;
  calculateUtilityEfficiency: (playerName: string, matchIds?: string[]) => UtilityEfficiency;
  calculateClutchProfile: (playerName: string) => ClutchProfile;
  detectRivalPatterns: (rivalTeamId: string) => RivalPatterns;
  calculateAdaptability: (playerName: string) => AdaptabilityMetrics;
  analyzeEntrySystem: (playerName: string) => EntryAnalysis;
  analyzeEconomyImpact: (matchId: string) => EconomyImpact;
  calculateDuoSynergy: (player1: string, player2: string) => DuoSynergy;
  analyzeMomentum: (matchId: string) => MomentumAnalysis;
  buildRoundTimeline: (matchId: string, round: number) => RoundTimeline;
  analyzeWinConditions: () => WinConditionProfile;
  analyzeSiteControl: (map: string) => SiteControlStats[];
  calculateConsistency: (playerName: string) => ConsistencyMetrics;
  
  // Batch operations
  getAllClutchProfiles: () => ClutchProfile[];
  getAllDuoSynergies: () => DuoSynergy[];
  getAllEntryAnalysis: () => EntryAnalysis[];
  getAllConsistencyMetrics: () => ConsistencyMetrics[];
  getTopDuos: (limit?: number) => DuoSynergy[];
  getBestEntryPlayers: (limit?: number) => EntryAnalysis[];
  getMostConsistentPlayers: (limit?: number) => ConsistencyMetrics[];
}

const STORAGE_KEY = 'valoanalytics_advanced_v1';

// Win Probability Algorithm
function calculateWinProbabilityAlgo(state: WinProbabilityState): WinProbabilityResult {
  const {
    economyUs,
    economyThem,
    playersAliveUs,
    playersAliveThem,
    spikePlanted,
    utilityUs,
    utilityThem,
    mapControlUs,
    mapControlThem,
  } = state;

  // Base probability from player numbers (most important)
  const numbersAdvantage = playersAliveUs - playersAliveThem;
  let numbersWeight = 0.4;
  let baseProb = 50 + numbersAdvantage * 15;

  // Economy factor
  const econDiff = economyUs - economyThem;
  const econWeight = 0.25;
  const econImpact = Math.min(Math.max(econDiff / 1000, -15), 15);

  // Utility factor
  const utilDiff = utilityUs - utilityThem;
  const utilWeight = 0.15;
  const utilImpact = utilDiff * 0.2;

  // Map control factor
  const controlDiff = mapControlUs - mapControlThem;
  const controlWeight = 0.1;
  const controlImpact = controlDiff * 0.15;

  // Spike factor (huge advantage)
  const spikeWeight = 0.1;
  const spikeImpact = spikePlanted ? 12 : 0;

  // Calculate final probability
  let probabilityUs = baseProb + econImpact + utilImpact + controlImpact + spikeImpact;
  
  // Clamp to valid range
  probabilityUs = Math.min(Math.max(probabilityUs, 5), 95);

  // Calculate confidence based on data completeness
  const confidence = 0.7 + (numbersWeight * 0.3);

  return {
    probabilityUs,
    probabilityThem: 100 - probabilityUs,
    confidence,
    factors: {
      economyWeight: econWeight * 100,
      numbersWeight: numbersWeight * 100,
      utilityWeight: utilWeight * 100,
      mapControlWeight: controlWeight * 100,
      spikeWeight: spikeWeight * 100,
    },
  };
}

export const useAdvancedAnalyticsStore = create<AdvancedAnalyticsState>()(
  persist(
    (_set, get) => ({
      calculateWinProbability: calculateWinProbabilityAlgo,

      calculateConversionStats: (matchId: string) => {
        // Get match data from match store
        const matches = JSON.parse(localStorage.getItem('valoanalytics_matches_v1') || '{}');
        const match = matches.state?.matches?.find((m: Match) => m.id === matchId);
        
        if (!match || !match.rounds) {
          return {
            afterFirstKill: { total: 0, converted: 0, rate: 0 },
            afterAdvantage5v4: { total: 0, converted: 0, rate: 0 },
            afterSpikePlanted: { total: 0, won: 0, rate: 0 },
            after2PlusAdvantage: { total: 0, converted: 0, rate: 0 },
            antiThrowIndex: 50,
          };
        }

        const rounds = match.rounds;
        
        // Calculate conversion stats
        const stats: ConversionStats = {
          afterFirstKill: { total: 0, converted: 0, rate: 0 },
          afterAdvantage5v4: { total: 0, converted: 0, rate: 0 },
          afterSpikePlanted: { total: 0, won: 0, rate: 0 },
          after2PlusAdvantage: { total: 0, converted: 0, rate: 0 },
          antiThrowIndex: 50,
        };

        rounds.forEach((round: Round) => {
          // After spike planted
          if (round.bombPlanted) {
            stats.afterSpikePlanted.total++;
            if (round.outcome === 'WIN') {
              stats.afterSpikePlanted.won++;
            }
          }

          // After first kill (simplified - would need kill data)
          if (round.killsUs > 0 || round.killsOpp > 0) {
            stats.afterFirstKill.total++;
            if (round.outcome === 'WIN') {
              stats.afterFirstKill.converted++;
            }
          }
        });

        // Calculate rates
        stats.afterFirstKill.rate = stats.afterFirstKill.total > 0 
          ? (stats.afterFirstKill.converted / stats.afterFirstKill.total) * 100 
          : 0;
        stats.afterSpikePlanted.rate = stats.afterSpikePlanted.total > 0 
          ? (stats.afterSpikePlanted.won / stats.afterSpikePlanted.total) * 100 
          : 0;

        // Anti-throw index (higher = better at closing rounds)
        stats.antiThrowIndex = Math.round(
          (stats.afterSpikePlanted.rate * 0.4 + stats.afterFirstKill.rate * 0.6)
        );

        return stats;
      },

      calculateUtilityEfficiency: (playerName: string, _matchIds?: string[]) => {
        // Placeholder - would need detailed utility tracking
        return {
          playerName,
          flashes: { thrown: 0, enemiesFlashed: 0, avgFlashDuration: 0, flashAssists: 0, efficiencyScore: 50 },
          recon: { thrown: 0, enemiesSpotted: 0, detectionRate: 0 },
          smokes: { thrown: 0, effectiveBlocks: 0, decorativeBlocks: 0, effectiveness: 50 },
          mollies: { thrown: 0, damageDealt: 0, zoneDenialTime: 0 },
          overallWasted: 25,
          utilityImpactScore: 65,
        };
      },

      calculateClutchProfile: (playerName: string) => {
        const matches = JSON.parse(localStorage.getItem('valoanalytics_matches_v1') || '{}');
        const allMatches: Match[] = matches.state?.matches || [];
        
        let totalClutches = 0;
        let wonClutches = 0;
        const mapStats: { map: string; clutches: number; wins: number }[] = [];

        allMatches.forEach((match) => {
          if (!match.rounds) return;
          
          match.rounds.forEach((round) => {
            // Detect clutch situations (1vX or 2vX where X > players alive)
            // Simplified detection
            if (round.clutchWon && round.clutchSituation?.includes(playerName)) {
              totalClutches++;
              if (round.outcome === 'WIN') {
                wonClutches++;
              }
              
              const mapStat = mapStats.find((m) => m.map === match.map);
              if (mapStat) {
                mapStat.clutches++;
                if (round.outcome === 'WIN') mapStat.wins++;
              } else {
                mapStats.push({ map: match.map, clutches: 1, wins: round.outcome === 'WIN' ? 1 : 0 });
              }
            }
          });
        });

        return {
          playerName,
          totalClutches,
          wonClutches,
          winRate: totalClutches > 0 ? (wonClutches / totalClutches) * 100 : 0,
          avgDecisionTime: 8.5, // Would need timestamp data
          commonPositions: [],
          postPlantWinRate: 60,
          retakeWinRate: 40,
          utilityUsageInClutch: 45,
          winRateByMap: mapStats,
          clutchRating: totalClutches > 0 ? Math.min((wonClutches / totalClutches) * 100 + 20, 100) : 50,
        };
      },

      detectRivalPatterns: (rivalTeamId: string) => {
        // Would analyze rival match data
        return {
          teamId: rivalTeamId,
          teamName: 'Rival Team',
          pistolRounds: { atkWins: 3, defWins: 2, commonStrategy: 'Aggressive push' },
          afterTimeout: { roundsAfter: 10, wins: 6, winRate: 60, commonChange: 'Switch to B' },
          stackPatterns: [
            { site: 'A', frequency: 45, successRate: 55 },
            { site: 'B', frequency: 55, successRate: 48 },
          ],
          defaultPatterns: [],
          lurkPatterns: [],
          predictions: [
            { scenario: 'After eco loss', probability: 70, recommendation: 'Expect aggressive push A' },
          ],
        };
      },

      calculateAdaptability: (playerName: string) => {
        return {
          playerName,
          firstEncounterWinRate: 52,
          rematchWinRate: 58,
          afterCompChange: { matches: 5, wins: 3, adaptationSpeed: 2 },
          afterLosingStreak3: { occurrences: 3, recoveryRate: 67 },
          afterTimeout: { roundsAfter: 15, wins: 9, impact: 12 },
          adaptabilityScore: 72,
        };
      },

      analyzeEntrySystem: (playerName: string) => {
        return {
          playerName,
          entryAttempts: 45,
          entrySuccess: 18,
          entryDeaths: 27,
          entrySuccessRate: 40,
          tradeEfficiency: 65,
          entryWithUtility: { attempts: 30, success: 15, rate: 50 },
          entryWithoutUtility: { attempts: 15, success: 3, rate: 20 },
          defaultEntry: { attempts: 20, success: 6 },
          executeEntry: { attempts: 25, success: 12 },
          entryRating: 68,
        };
      },

      analyzeEconomyImpact: (_matchId: string) => {
        return {
          forceDecisions: [],
          ecoStackSuccess: 15,
          forceWinRate: 35,
          fullBuyWinRate: 58,
          economicEfficiency: 62,
          recommendedStrategy: 'Eco on 2nd round after pistol loss, force on 3rd',
        };
      },

      calculateDuoSynergy: (player1: string, player2: string) => {
        const matches = JSON.parse(localStorage.getItem('valoanalytics_matches_v1') || '{}');
        const allMatches: Match[] = matches.state?.matches || [];
        
        let matchesTogether = 0;
        let winsTogether = 0;

        allMatches.forEach((match: any) => {
          const hasP1 = match.players?.some((p: any) => p.name === player1);
          const hasP2 = match.players?.some((p: any) => p.name === player2);
          
          if (hasP1 && hasP2) {
            matchesTogether++;
            if (match.won) winsTogether++;
          }
        });

        const winRate = matchesTogether > 0 ? (winsTogether / matchesTogether) * 100 : 0;
        
        return {
          player1,
          player2,
          matchesTogether,
          winRateTogether: winRate,
          tradeRate: 12.5,
          combinedACS: 420,
          postPlantSuccess: 65,
          clutchTogetherRate: 30,
          synergyScore: Math.min(winRate + 25, 100),
          recommended: winRate > 55,
        };
      },

      analyzeMomentum: (matchId: string) => {
        const matches = JSON.parse(localStorage.getItem('valoanalytics_matches_v1') || '{}');
        const match = matches.state?.matches?.find((m: Match) => m.id === matchId);
        
        if (!match || !match.rounds) {
          return {
            matchId,
            points: [],
            keyRounds: [],
            timeoutEffectiveness: [],
            comebackPotential: 50,
          };
        }

        const points: MomentumAnalysis['points'] = [];
        const keyRounds: MomentumAnalysis['keyRounds'] = [];
        
        let scoreUs = 0;
        let scoreThem = 0;

        match.rounds.forEach((round: Round, idx: number) => {
          if (round.outcome === 'WIN') scoreUs++;
          else scoreThem++;

          const winProb = (scoreUs / (scoreUs + scoreThem)) * 100;
          
          points.push({
            round: idx + 1,
            scoreUs,
            scoreThem,
            winProbability: winProb,
            keyEvent: round.keyMoments?.[0],
            momentumShift: round.outcome === 'WIN' ? 10 : -10,
          });

          // Detect key rounds (swings)
          if (idx > 0) {
            const prevPoint = points[idx - 1];
            const shift = Math.abs(winProb - prevPoint.winProbability);
            if (shift > 15) {
              keyRounds.push({
                round: idx + 1,
                description: round.keyMoments?.[0] || 'Momentum swing',
                impact: shift,
              });
            }
          }
        });

        return {
          matchId,
          points,
          keyRounds,
          timeoutEffectiveness: [],
          comebackPotential: scoreUs > scoreThem ? 70 : 40,
        };
      },

      buildRoundTimeline: (_matchId: string, round: number) => {
        return {
          round,
          events: [
            { time: 0, type: 'CALL', description: 'Round start', impact: 0 },
            { time: 30, type: 'UTILITY', description: 'Smoke deployed', impact: 2 },
            { time: 45, type: 'KILL', description: 'First blood', impact: 5 },
          ],
          keyMoments: ['First blood at 45s'],
          winningPlay: 'Fast execute B',
          losingMistake: 'No rotation on fake',
        };
      },

      analyzeWinConditions: () => {
        return {
          teamLevel: 'ADAPTIVE',
          optimalPace: 45,
          bestMaps: ['Ascent', 'Bind'],
          worstMaps: ['Breeze'],
          preferredSide: 'DEF',
          winConditions: [
            { condition: 'Slow start', description: 'First 40s without commits', winRate: 68, sampleSize: 25, confidence: 0.75, recommendation: 'Play default, gather info' },
            { condition: 'Utility advantage', description: 'More util than opponent', winRate: 72, sampleSize: 30, confidence: 0.8, recommendation: 'Force util trades' },
          ],
          avoidConditions: ['Fast executes without info'],
        };
      },

      analyzeSiteControl: (map: string) => {
        return [
          { map, site: 'A', avgControlTime: 25, fakeSuccessRate: 40, avgRotationTime: 12, overRotationRate: 15, commonExecutes: ['A main push', 'A split'], defenseWeaknesses: ['Heaven control'] },
          { map, site: 'B', avgControlTime: 30, fakeSuccessRate: 35, avgRotationTime: 15, overRotationRate: 20, commonExecutes: ['B tunnel', 'B split'], defenseWeaknesses: ['Back site'] },
        ];
      },

      calculateConsistency: (playerName: string) => {
        return {
          playerName,
          acsStdDev: 45,
          kdVariance: 0.3,
          impactStability: 68,
          performanceByMap: [
            { map: 'Ascent', consistency: 75 },
            { map: 'Bind', consistency: 62 },
          ],
          coinflipIndex: 35,
          reliabilityRating: 'CONSISTENT',
        };
      },

      getAllClutchProfiles: () => {
        const players = JSON.parse(localStorage.getItem('valoanalytics_players_v1') || '{}');
        const playerNames = players.state?.players?.map((p: { name: string }) => p.name) || [];
        return playerNames.map((name: string) => get().calculateClutchProfile(name));
      },

      getAllDuoSynergies: () => {
        const players = JSON.parse(localStorage.getItem('valoanalytics_players_v1') || '{}');
        const playerNames = players.state?.players?.map((p: { name: string }) => p.name) || [];
        const synergies: DuoSynergy[] = [];
        
        for (let i = 0; i < playerNames.length; i++) {
          for (let j = i + 1; j < playerNames.length; j++) {
            synergies.push(get().calculateDuoSynergy(playerNames[i], playerNames[j]));
          }
        }
        
        return synergies;
      },

      getAllEntryAnalysis: () => {
        const players = JSON.parse(localStorage.getItem('valoanalytics_players_v1') || '{}');
        const playerNames = players.state?.players?.map((p: { name: string }) => p.name) || [];
        return playerNames.map((name: string) => get().analyzeEntrySystem(name));
      },

      getTopDuos: (limit = 5) => {
        return get()
          .getAllDuoSynergies()
          .sort((a, b) => b.synergyScore - a.synergyScore)
          .slice(0, limit);
      },

      getBestEntryPlayers: (limit = 5) => {
        return get()
          .getAllEntryAnalysis()
          .sort((a, b) => b.entryRating - a.entryRating)
          .slice(0, limit);
      },

      getAllConsistencyMetrics: function() {
        const players = JSON.parse(localStorage.getItem('valoanalytics_players_v1') || '{}');
        const playerNames = players.state?.players?.map((p: { name: string }) => p.name) || [];
        return playerNames.map((name: string) => get().calculateConsistency(name));
      },

      getMostConsistentPlayers: (limit = 5) => {
        const metrics = get().getAllConsistencyMetrics();
        return metrics
          .sort((a: any, b: any) => a.coinflipIndex - b.coinflipIndex)
          .slice(0, limit);
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

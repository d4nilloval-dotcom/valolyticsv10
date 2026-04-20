import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar,
  AlertTriangle,
  Target,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Award
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';

interface WeeklyStats {
  week: string;
  startDate: string;
  endDate: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgACS: number;
  avgKD: number;
  avgKAST: number;
  rating: number;
}

interface TrendIndicator {
  direction: 'up' | 'down' | 'stable';
  change: number;
  severity: 'good' | 'warning' | 'critical';
}

function calculateTrend(current: number, previous: number): TrendIndicator {
  const change = previous === 0 ? 0 : ((current - previous) / previous) * 100;
  
  if (change > 10) {
    return { direction: 'up', change, severity: 'good' };
  } else if (change < -10) {
    return { direction: 'down', change, severity: 'critical' };
  } else if (change > 5) {
    return { direction: 'up', change, severity: 'good' };
  } else if (change < -5) {
    return { direction: 'down', change, severity: 'warning' };
  }
  
  return { direction: 'stable', change, severity: 'good' };
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekDates(weekKey: string): { start: string; end: string } {
  const [year, weekStr] = weekKey.split('-W');
  const week = parseInt(weekStr);
  const yearStart = new Date(parseInt(year), 0, 1);
  const dayOffset = (week - 1) * 7 - yearStart.getDay() + 1;
  const startDate = new Date(yearStart);
  startDate.setDate(yearStart.getDate() + dayOffset);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
}

interface PlayerWeeklyData {
  name: string;
  weeklyStats: WeeklyStats[];
}

export function WeeklyTracker() {
  const { getPlayerStats, getFilteredMatches, getPlayersForMatch } = useAppStore();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'4' | '8' | '12'>('8');

  const players = getPlayerStats('ALL');
  const matches = getFilteredMatches();

  // Calculate weekly stats for each player
  const playerWeeklyData: PlayerWeeklyData[] = useMemo(() => {
    return players.map(player => {
      // Find matches where this player participated
      const playerMatches = matches.filter(m => {
        const matchPlayers = getPlayersForMatch(m.id);
        return matchPlayers.some((p: any) => p.name === player.name);
      });

      // Group by week
      const weeklyData: Record<string, { matches: any[]; totalACS: number; totalKD: number; totalKAST: number }> = {};
      
      playerMatches.forEach(match => {
        const matchDate = new Date(match.date);
        const weekKey = getWeekKey(matchDate);
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { matches: [], totalACS: 0, totalKD: 0, totalKAST: 0 };
        }
        
        weeklyData[weekKey].matches.push(match);
        
        // Find player stats in this match
        const matchPlayers = getPlayersForMatch(match.id);
        const playerMatchData = matchPlayers.find((p: any) => p.name === player.name);
        if (playerMatchData) {
          weeklyData[weekKey].totalACS += playerMatchData.acs || 0;
          const kd = playerMatchData.d === 0 ? playerMatchData.k : playerMatchData.k / playerMatchData.d;
          weeklyData[weekKey].totalKD += kd;
          weeklyData[weekKey].totalKAST += playerMatchData.kast || 0;
        }
      });

      const weeklyStats: WeeklyStats[] = Object.entries(weeklyData)
        .map(([week, data]) => {
          const dates = getWeekDates(week);
          const wins = data.matches.filter(m => m.won).length;
          const matchCount = data.matches.length;
          
          return {
            week,
            startDate: dates.start,
            endDate: dates.end,
            matches: matchCount,
            wins,
            losses: matchCount - wins,
            winRate: matchCount > 0 ? (wins / matchCount) * 100 : 0,
            avgACS: matchCount > 0 ? data.totalACS / matchCount : 0,
            avgKD: matchCount > 0 ? data.totalKD / matchCount : 0,
            avgKAST: matchCount > 0 ? data.totalKAST / matchCount : 0,
            rating: player.rating
          };
        })
        .sort((a, b) => a.week.localeCompare(b.week));

      return { name: player.name, weeklyStats };
    });
  }, [players, matches]);

  const selectedPlayerData = playerWeeklyData.find(p => p.name === selectedPlayer) || playerWeeklyData[0];
  
  // Filter by time range
  const filteredStats = useMemo(() => {
    if (!selectedPlayerData) return [];
    const weeksToShow = parseInt(timeRange);
    return selectedPlayerData.weeklyStats.slice(-weeksToShow);
  }, [selectedPlayerData, timeRange]);

  // Calculate trends
  const trends = useMemo(() => {
    if (filteredStats.length < 2) return null;
    
    const current = filteredStats[filteredStats.length - 1];
    const previous = filteredStats[filteredStats.length - 2];
    
    return {
      winRate: calculateTrend(current.winRate, previous.winRate),
      avgACS: calculateTrend(current.avgACS, previous.avgACS),
      avgKD: calculateTrend(current.avgKD, previous.avgKD),
      avgKAST: calculateTrend(current.avgKAST, previous.avgKAST)
    };
  }, [filteredStats]);

  // Chart data
  const chartData = useMemo(() => {
    return filteredStats.map(stat => ({
      week: stat.week.split('-W')[1],
      winRate: stat.winRate,
      avgACS: stat.avgACS,
      avgKD: stat.avgKD * 100, // Scale for visibility
      avgKAST: stat.avgKAST,
      matches: stat.matches
    }));
  }, [filteredStats]);

  const renderTrendBadge = (trend: TrendIndicator | undefined, label: string, value: number, format: (v: number) => string) => {
    if (!trend) return null;
    
    const isGood = (label === 'Win Rate' || label === 'ACS' || label === 'KAST') 
      ? trend.direction === 'up' 
      : trend.direction === 'up';
    
    return (
      <div className={cn(
        "glass-card p-4 relative overflow-hidden",
        trend.direction === 'up' && isGood && "border-green-500/30",
        trend.direction === 'down' && isGood && "border-red-500/30",
        trend.direction === 'up' && !isGood && "border-red-500/30",
        trend.direction === 'down' && !isGood && "border-green-500/30"
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            trend.direction === 'up' && isGood && "bg-green-500/20 text-green-400",
            trend.direction === 'down' && isGood && "bg-red-500/20 text-red-400",
            trend.direction === 'up' && !isGood && "bg-red-500/20 text-red-400",
            trend.direction === 'down' && !isGood && "bg-green-500/20 text-green-400",
            trend.direction === 'stable' && "bg-gray-500/20 text-gray-400"
          )}>
            {trend.direction === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {trend.direction === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {trend.direction === 'stable' && <Minus className="w-3 h-3" />}
            {Math.abs(trend.change).toFixed(1)}%
          </div>
        </div>
        <p className="text-2xl font-bold font-mono">{format(value)}</p>
        {trend.severity === 'critical' && (
          <div className="flex items-center gap-1 mt-2 text-xs text-red-400">
            <AlertTriangle className="w-3 h-3" />
            <span>Bajando rendimiento</span>
          </div>
        )}
        {trend.severity === 'good' && trend.direction === 'up' && (
          <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
            <TrendingUp className="w-3 h-3" />
            <span>Mejorando</span>
          </div>
        )}
      </div>
    );
  };

  if (players.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-muted-foreground">
        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No hay datos de jugadores</p>
        <p className="text-sm mt-1">Añade partidos para ver el seguimiento semanal</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <select
            value={selectedPlayer || players[0]?.name}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="input-pro"
          >
            {players.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '4' | '8' | '12')}
            className="input-pro"
          >
            <option value="4">Últimas 4 semanas</option>
            <option value="8">Últimas 8 semanas</option>
            <option value="12">Últimas 12 semanas</option>
          </select>
        </div>
      </div>

      {/* Trend Alerts */}
      {trends && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-400" />
            Tendencias vs Semana Anterior
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {renderTrendBadge(trends.winRate, 'Win Rate', filteredStats[filteredStats.length - 1]?.winRate || 0, v => `${v.toFixed(1)}%`)}
            {renderTrendBadge(trends.avgACS, 'ACS', filteredStats[filteredStats.length - 1]?.avgACS || 0, v => v.toFixed(0))}
            {renderTrendBadge(trends.avgKD, 'K/D', filteredStats[filteredStats.length - 1]?.avgKD || 0, v => v.toFixed(2))}
            {renderTrendBadge(trends.avgKAST, 'KAST', filteredStats[filteredStats.length - 1]?.avgKAST || 0, v => `${v.toFixed(0)}%`)}
          </div>
        </div>
      )}

      {/* Weekly Summary */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          Resumen Semanal
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase"
                style={{ background: 'hsl(220 20% 9%)' }}
              >
                <th className="py-3 px-3">Semana</th>
                <th className="py-3 px-3">Fechas</th>
                <th className="py-3 px-3">Partidos</th>
                <th className="py-3 px-3">W-L</th>
                <th className="py-3 px-3">Win Rate</th>
                <th className="py-3 px-3">ACS</th>
                <th className="py-3 px-3">K/D</th>
                <th className="py-3 px-3">KAST</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((stat, i) => {
                const prevStat = i > 0 ? filteredStats[i - 1] : null;
                const winRateTrend = prevStat ? calculateTrend(stat.winRate, prevStat.winRate) : null;
                const acsTrend = prevStat ? calculateTrend(stat.avgACS, prevStat.avgACS) : null;
                
                return (
                  <tr key={stat.week} className="border-t border-border/50 hover:bg-white/5">
                    <td className="py-3 px-3 font-medium">{stat.week}</td>
                    <td className="py-3 px-3 text-sm text-muted-foreground">
                      {stat.startDate} - {stat.endDate}
                    </td>
                    <td className="py-3 px-3">{stat.matches}</td>
                    <td className="py-3 px-3 font-mono">
                      <span className="text-green-400">{stat.wins}</span>
                      <span className="text-muted-foreground mx-1">-</span>
                      <span className="text-red-400">{stat.losses}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono",
                          stat.winRate >= 60 ? "text-green-400" :
                          stat.winRate >= 45 ? "text-yellow-400" :
                          "text-red-400"
                        )}>
                          {stat.winRate.toFixed(1)}%
                        </span>
                        {winRateTrend && winRateTrend.direction !== 'stable' && (
                          <span className={cn(
                            "text-xs",
                            winRateTrend.direction === 'up' ? "text-green-400" : "text-red-400"
                          )}>
                            {winRateTrend.direction === 'up' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{stat.avgACS.toFixed(0)}</span>
                        {acsTrend && acsTrend.direction !== 'stable' && (
                          <span className={cn(
                            "text-xs",
                            acsTrend.direction === 'up' ? "text-green-400" : "text-red-400"
                          )}>
                            {acsTrend.direction === 'up' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">{stat.avgKD.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono">{stat.avgKAST.toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Rate Chart */}
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Win Rate Semanal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorWinRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                <XAxis dataKey="week" stroke="hsl(215 15% 55%)" fontSize={12} />
                <YAxis stroke="hsl(215 15% 55%)" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(220 22% 8%)',
                    border: '1px solid hsl(220 15% 20%)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                />
                <ReferenceLine y={50} stroke="#666" strokeDasharray="3 3" />
                <Area 
                  type="monotone" 
                  dataKey="winRate" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorWinRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ACS Chart */}
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-400" />
            ACS Semanal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                <XAxis dataKey="week" stroke="hsl(215 15% 55%)" fontSize={12} />
                <YAxis stroke="hsl(215 15% 55%)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(220 22% 8%)',
                    border: '1px solid hsl(220 15% 20%)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value.toFixed(0), 'ACS']}
                />
                <ReferenceLine y={200} stroke="#eab308" strokeDasharray="3 3" label="Promedio" />
                <Line 
                  type="monotone" 
                  dataKey="avgACS" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      {trends && (
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Insights de Rendimiento
          </h3>
          <div className="space-y-3">
            {trends.winRate.severity === 'critical' && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10">
                <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-400">Win Rate bajando</p>
                  <p className="text-sm text-muted-foreground">
                    El win rate ha bajado un {Math.abs(trends.winRate.change).toFixed(1)}% esta semana. 
                    Revisa las tácticas y comunicación del equipo.
                  </p>
                </div>
              </div>
            )}
            
            {trends.avgACS.severity === 'critical' && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10">
                <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-400">ACS bajando</p>
                  <p className="text-sm text-muted-foreground">
                    El ACS ha bajado un {Math.abs(trends.avgACS.change).toFixed(1)}% esta semana.
                    Considera revisar la mecánica y posicionamiento.
                  </p>
                </div>
              </div>
            )}
            
            {trends.winRate.direction === 'up' && trends.winRate.severity === 'good' && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-400">¡Excelente progreso!</p>
                  <p className="text-sm text-muted-foreground">
                    El win rate ha subido un {trends.winRate.change.toFixed(1)}% esta semana. 
                    ¡Sigue así!
                  </p>
                </div>
              </div>
            )}
            
            {trends.avgACS.direction === 'up' && trends.avgACS.severity === 'good' && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-400">ACS mejorando</p>
                  <p className="text-sm text-muted-foreground">
                    El ACS ha subido un {trends.avgACS.change.toFixed(1)}% esta semana.
                    ¡Tu aim y decisiones están mejorando!
                  </p>
                </div>
              </div>
            )}
            
            {trends.avgKAST.direction === 'down' && trends.avgKAST.severity !== 'good' && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-400">KAST bajando</p>
                  <p className="text-sm text-muted-foreground">
                    El KAST ha bajado. Trabaja en tu utilidad y tradeo con el equipo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Swords, 
  Trophy,
  Calendar,
  Map as MapIcon,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useAppStore } from '@/store/appStore';
import { VALORANT_MAPS } from '@/types';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
}

function KPICard({ title, value, change, icon: Icon, trend = 'neutral', color = 'red' }: KPICardProps) {
  const colorMap = {
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  };

  const iconColorMap = {
    red: 'text-red-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
  };

  return (
    <div className={cn(
      "glass-card p-5 relative overflow-hidden group",
      "bg-gradient-to-br",
      colorMap[color]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
              {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
              <span className={cn(
                "text-xs font-medium",
                trend === 'up' && "text-green-400",
                trend === 'down' && "text-red-400",
                trend === 'neutral' && "text-muted-foreground"
              )}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl bg-white/5", iconColorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { getFilteredMatches, getMapStats, getPlayerStats, filters, setFilters } = useAppStore();
  
  const matches = getFilteredMatches();
  const mapStats = getMapStats(filters.matchType);
  const playerStats = getPlayerStats(filters.matchType);

  const kpis = useMemo(() => {
    const total = matches.length;
    const wins = matches.filter(m => m.won).length;
    const losses = total - wins;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
    
    const totalRounds = matches.reduce((acc, m) => acc + m.scoreUs + m.scoreOpp, 0);
    const avgRounds = total > 0 ? (totalRounds / total).toFixed(1) : '0.0';
    
    const pistolAtkW = matches.filter(m => m.pistolAtkWin).length;
    const pistolDefW = matches.filter(m => m.pistolDefWin).length;
    const pistolAtkRate = total > 0 ? ((pistolAtkW / total) * 100).toFixed(0) : '0';
    const pistolDefRate = total > 0 ? ((pistolDefW / total) * 100).toFixed(0) : '0';
    
    const postW = matches.reduce((acc, m) => acc + m.postWin, 0);
    const postL = matches.reduce((acc, m) => acc + m.postLoss, 0);
    const postRate = (postW + postL) > 0 ? ((postW / (postW + postL)) * 100).toFixed(0) : '0';
    
    const rtW = matches.reduce((acc, m) => acc + m.retakeWin, 0);
    const rtL = matches.reduce((acc, m) => acc + m.retakeLoss, 0);
    const rtRate = (rtW + rtL) > 0 ? ((rtW / (rtW + rtL)) * 100).toFixed(0) : '0';

    return {
      total, wins, losses, winRate, avgRounds,
      pistolAtkRate, pistolDefRate, postRate, rtRate
    };
  }, [matches]);

  const performanceData = useMemo(() => {
    return matches
      .slice(0, 10)
      .reverse()
      .map((m, i) => ({
        name: `M${i + 1}`,
        score: m.scoreUs,
        opponent: m.scoreOpp,
        result: m.won ? 1 : 0,
        map: m.map
      }));
  }, [matches]);

  const mapWinData = useMemo(() => {
    return mapStats
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 6)
      .map(m => ({
        name: m.map,
        wins: m.wins,
        losses: m.losses,
        winRate: m.winPct.toFixed(0)
      }));
  }, [mapStats]);

  const matchTypeData = useMemo(() => {
    const byType: Record<string, number> = {};
    matches.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
    });
    return Object.entries(byType).map(([type, count]) => ({
      name: type,
      value: count,
      color: type === 'SCRIM' ? '#ef4444' : type === 'PREMIER' ? '#3b82f6' : '#22c55e'
    }));
  }, [matches]);

  const topPlayers = useMemo(() => {
    return playerStats
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [playerStats]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.matchType}
          onChange={(e) => setFilters({ matchType: e.target.value as any })}
          className="input-pro"
        >
          <option value="ALL">Todos los tipos</option>
          <option value="SCRIM">SCRIM</option>
          <option value="PREMIER">PREMIER</option>
          <option value="OFICIAL">OFICIAL</option>
          <option value="TOURNAMENT">Torneo</option>
        </select>
        
        <select
          value={filters.map}
          onChange={(e) => setFilters({ map: e.target.value })}
          className="input-pro"
        >
          <option value="ALL">Todos los mapas</option>
          {VALORANT_MAPS.map(map => (
            <option key={map} value={map}>{map}</option>
          ))}
        </select>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Partidos Jugados"
          value={kpis.total}
          icon={Calendar}
          color="blue"
        />
        <KPICard
          title="Win Rate"
          value={`${kpis.winRate}%`}
          icon={Trophy}
          color="green"
        />
        <KPICard
          title="W - L"
          value={`${kpis.wins} - ${kpis.losses}`}
          icon={Activity}
          color="red"
        />
        <KPICard
          title="Rondas Promedio"
          value={kpis.avgRounds}
          icon={Target}
          color="purple"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pistolas ATK</p>
          <p className="text-xl font-bold text-yellow-400">{kpis.pistolAtkRate}%</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pistolas DEF</p>
          <p className="text-xl font-bold text-yellow-400">{kpis.pistolDefRate}%</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Postplant</p>
          <p className="text-xl font-bold text-green-400">{kpis.postRate}%</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Retakes</p>
          <p className="text-xl font-bold text-blue-400">{kpis.rtRate}%</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-400" />
              Rendimiento Reciente
            </h3>
            <span className="text-xs text-muted-foreground">Últimos 10 partidos</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOpp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(215 15% 55%)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(215 15% 55%)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(220 22% 8%)',
                    border: '1px solid hsl(220 15% 20%)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorScore)"
                  name="Nuestro Score"
                />
                <Area 
                  type="monotone" 
                  dataKey="opponent" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorOpp)"
                  name="Rival"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Map Performance */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-blue-400" />
              Rendimiento por Mapa
            </h3>
            <span className="text-xs text-muted-foreground">Top 6 mapas</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mapWinData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                <XAxis 
                  type="number" 
                  stroke="hsl(215 15% 55%)"
                  fontSize={12}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="hsl(215 15% 55%)"
                  fontSize={12}
                  width={70}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(220 22% 8%)',
                    border: '1px solid hsl(220 15% 20%)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="wins" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} name="Victorias" />
                <Bar dataKey="losses" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} name="Derrotas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Types */}
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Swords className="w-5 h-5 text-purple-400" />
            Tipos de Partido
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={matchTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {matchTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(220 22% 8%)',
                    border: '1px solid hsl(220 15% 20%)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {matchTypeData.map((type) => (
              <div key={type.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ background: type.color }}
                />
                <span className="text-xs text-muted-foreground">{type.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Players */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Top Jugadores
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase">
                  <th className="pb-3">#</th>
                  <th className="pb-3">Jugador</th>
                  <th className="pb-3">Partidos</th>
                  <th className="pb-3">ACS</th>
                  <th className="pb-3">K/D</th>
                  <th className="pb-3">KAST</th>
                  <th className="pb-3">Rating</th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map((player, i) => (
                  <tr key={player.name} className="border-t border-border/50">
                    <td className="py-3">
                      <span className={cn(
                        "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                        i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                        i === 1 ? "bg-gray-400/20 text-gray-400" :
                        i === 2 ? "bg-orange-600/20 text-orange-400" :
                        "text-muted-foreground"
                      )}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{player.name}</td>
                    <td className="py-3 text-muted-foreground">{player.matches}</td>
                    <td className="py-3 font-mono">{player.acsAvg.toFixed(0)}</td>
                    <td className={cn(
                      "py-3 font-mono",
                      player.kd >= 1.2 ? "text-green-400" :
                      player.kd >= 1.0 ? "text-yellow-400" :
                      "text-red-400"
                    )}>
                      {player.kd.toFixed(2)}
                    </td>
                    <td className="py-3 font-mono">{player.kastAvg.toFixed(0)}%</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                        {player.rating.toFixed(3)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

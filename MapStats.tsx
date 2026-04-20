import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Target,
  Shield,
  Activity,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useAppStore } from '@/store/appStore';
import { VALORANT_MAPS, type MatchType } from '@/types';
import { cn } from '@/lib/utils';

export function MapStats() {
  const { getMapStats, getFilteredMatches, filters, setFilters } = useAppStore();
  const [selectedMap, setSelectedMap] = useState<string | null>(null);

  const mapStats = getMapStats(filters.matchType);
  const matches = getFilteredMatches();

  const sortedStats = useMemo(() => {
    return [...mapStats].sort((a, b) => b.matches - a.matches);
  }, [mapStats]);

  const mapWinData = useMemo(() => {
    return sortedStats.map(m => ({
      name: m.map,
      wins: m.wins,
      losses: m.losses,
      winRate: parseFloat(m.winPct.toFixed(1))
    }));
  }, [sortedStats]);

  const pistolData = useMemo(() => {
    return sortedStats.map(m => ({
      name: m.map,
      atk: parseFloat(m.pistAtkPct.toFixed(0)),
      def: parseFloat(m.pistDefPct.toFixed(0))
    }));
  }, [sortedStats]);

  const postRetakeData = useMemo(() => {
    return sortedStats.map(m => ({
      name: m.map,
      post: parseFloat(m.postPct.toFixed(0)),
      retake: parseFloat(m.rtPct.toFixed(0))
    }));
  }, [sortedStats]);

  const selectedMapStats = selectedMap ? mapStats.find(m => m.map === selectedMap) : null;
  const selectedMapMatches = selectedMap 
    ? matches.filter(m => m.map === selectedMap).slice(0, 10).reverse()
    : [];

  const performanceTrend = useMemo(() => {
    return selectedMapMatches.map((m, i) => ({
      name: `M${i + 1}`,
      score: m.scoreUs,
      opponent: m.scoreOpp,
      result: m.won ? 1 : 0
    }));
  }, [selectedMapMatches]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.matchType}
            onChange={(e) => setFilters({ matchType: e.target.value as MatchType | 'ALL' })}
            className="input-pro"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="SCRIM">SCRIM</option>
            <option value="PREMIER">PREMIER</option>
            <option value="OFICIAL">OFICIAL</option>
          </select>
          
          <select
            value={selectedMap || ''}
            onChange={(e) => setSelectedMap(e.target.value || null)}
            className="input-pro"
          >
            <option value="">Todos los mapas</option>
            {VALORANT_MAPS.map(map => (
              <option key={map} value={map}>{map}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {sortedStats.map((stat) => (
          <button
            key={stat.map}
            onClick={() => setSelectedMap(selectedMap === stat.map ? null : stat.map)}
            className={cn(
              "glass-card p-4 text-left transition-all hover:border-red-500/30",
              selectedMap === stat.map && "border-red-500/50 ring-1 ring-red-500/30"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{stat.map}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                stat.winPct >= 60 ? "bg-green-500/20 text-green-400" :
                stat.winPct >= 45 ? "bg-yellow-500/20 text-yellow-400" :
                "bg-red-500/20 text-red-400"
              )}>
                {stat.winPct.toFixed(0)}%
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Partidos</span>
                <span className="font-mono">{stat.matches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">W</span>
                <span className="font-mono text-green-400">{stat.wins}</span>
                <span className="text-red-400 ml-2">L</span>
                <span className="font-mono text-red-400">{stat.losses}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Charts */}
      {!selectedMap ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Win Rate by Map */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Win Rate por Mapa
              </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mapWinData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                  <XAxis type="number" stroke="hsl(215 15% 55%)" fontSize={12} />
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

          {/* Pistol Rounds */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-400" />
                Pistolas por Mapa (%)
              </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pistolData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                  <XAxis dataKey="name" stroke="hsl(215 15% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215 15% 55%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(220 22% 8%)',
                      border: '1px solid hsl(220 15% 20%)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="atk" fill="#eab308" radius={[4, 4, 0, 0]} name="ATK %" />
                  <Bar dataKey="def" fill="#3b82f6" radius={[4, 4, 0, 0]} name="DEF %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Postplant & Retake */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Postplant & Retake (%)
              </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postRetakeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                  <XAxis dataKey="name" stroke="hsl(215 15% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215 15% 55%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(220 22% 8%)',
                      border: '1px solid hsl(220 15% 20%)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="post" fill="#22c55e" radius={[4, 4, 0, 0]} name="Postplant %" />
                  <Bar dataKey="retake" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Retake %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Map Distribution */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Distribución de Mapas
              </h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sortedStats.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="matches"
                    nameKey="map"
                  >
                    {sortedStats.slice(0, 6).map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#06b6d4'
                      ][index % 6]} />
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
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {sortedStats.slice(0, 6).map((stat, i) => (
                <div key={stat.map} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ background: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#06b6d4'][i] }}
                  />
                  <span className="text-xs text-muted-foreground">{stat.map}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Selected Map Detail View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{selectedMap}</h2>
            <button 
              onClick={() => setSelectedMap(null)}
              className="btn-secondary"
            >
              Volver a todos
            </button>
          </div>

          {selectedMapStats && (
            <>
              {/* Map KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="glass-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Partidos</p>
                  <p className="text-2xl font-bold">{selectedMapStats.matches}</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    selectedMapStats.winPct >= 60 ? "text-green-400" :
                    selectedMapStats.winPct >= 45 ? "text-yellow-400" :
                    "text-red-400"
                  )}>
                    {selectedMapStats.winPct.toFixed(1)}%
                  </p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">W - L</p>
                  <p className="text-2xl font-bold font-mono">
                    <span className="text-green-400">{selectedMapStats.wins}</span>
                    <span className="text-muted-foreground mx-1">-</span>
                    <span className="text-red-400">{selectedMapStats.losses}</span>
                  </p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Pistolas ATK</p>
                  <p className="text-2xl font-bold text-yellow-400">{selectedMapStats.pistAtkPct.toFixed(0)}%</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Pistolas DEF</p>
                  <p className="text-2xl font-bold text-blue-400">{selectedMapStats.pistDefPct.toFixed(0)}%</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Postplant</p>
                  <p className="text-2xl font-bold text-green-400">{selectedMapStats.postPct.toFixed(0)}%</p>
                </div>
              </div>

              {/* Performance Trend */}
              {performanceTrend.length > 0 && (
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-red-400" />
                      Rendimiento Reciente en {selectedMap}
                    </h3>
                    <span className="text-xs text-muted-foreground">Últimos {performanceTrend.length} partidos</span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                        <XAxis dataKey="name" stroke="hsl(215 15% 55%)" fontSize={12} />
                        <YAxis stroke="hsl(215 15% 55%)" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'hsl(220 22% 8%)',
                            border: '1px solid hsl(220 15% 20%)',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          name="Nuestro Score"
                          dot={{ fill: '#ef4444', strokeWidth: 0 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="opponent" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Rival"
                          dot={{ fill: '#3b82f6', strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

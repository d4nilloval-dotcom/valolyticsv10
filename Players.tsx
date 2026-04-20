import { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  TrendingUp,
  Target,
  Shield,
  Swords,
  Zap,
  Clock,
  DollarSign
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { VALORANT_AGENTS, AGENT_ROLES, type Player } from '@/types';
import { cn } from '@/lib/utils';
import { MatchTimeline } from './MatchTimeline';
import { EconomyAnalysis } from './EconomyAnalysis';

interface PlayerRow extends Player {
  isNew?: boolean;
}

function createEmptyPlayer(): PlayerRow {
  return {
    id: crypto.randomUUID(),
    name: '',
    agent: '',
    role: 'Unknown',
    k: 0,
    d: 0,
    a: 0,
    kast: 0,
    fk: 0,
    fd: 0,
    acs: 0,
    plants: 0,
    defuses: 0,
    isNew: true
  };
}

function calculateKD(k: number, d: number): number {
  return d === 0 ? k : k / d;
}

function calculateKDA(k: number, d: number, a: number): number {
  return d === 0 ? k + a : (k + a) / d;
}

function calculateVLRScore(player: Player): number {
  const kd = calculateKD(player.k, player.d);
  const impact = player.fk - player.fd;
  const obj = player.plants * 0.35 + player.defuses * 0.45;
  return player.acs * 0.55 + player.kast * 0.6 + kd * 40 + impact * 8 + obj * 10;
}

const sortOptions = [
  { value: 'vlr', label: 'Rating VLR', icon: TrendingUp },
  { value: 'acs', label: 'ACS', icon: Zap },
  { value: 'kd', label: 'K/D', icon: Swords },
  { value: 'kast', label: 'KAST%', icon: Shield },
];

export function Players() {
  const { 
    activeMatchId, 
    getMatchById, 
    getPlayersForMatch, 
    setPlayersForMatch,
    setActiveMatchId,
    setActiveTab
  } = useAppStore();
  
  const [sortBy, setSortBy] = useState('vlr');
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'players' | 'timeline' | 'economy'>('players');

  const match = activeMatchId ? getMatchById(activeMatchId) : null;
  const players = activeMatchId ? getPlayersForMatch(activeMatchId) : [];

  const rankedPlayers = useMemo(() => {
    const list = [...players];
    switch (sortBy) {
      case 'acs':
        return list.sort((a, b) => b.acs - a.acs);
      case 'kd':
        return list.sort((a, b) => calculateKD(b.k, b.d) - calculateKD(a.k, a.d));
      case 'kast':
        return list.sort((a, b) => b.kast - a.kast);
      case 'vlr':
      default:
        return list.sort((a, b) => calculateVLRScore(b) - calculateVLRScore(a));
    }
  }, [players, sortBy]);

  const rankings = useMemo(() => {
    const map = new Map<string, number>();
    rankedPlayers.forEach((p, i) => map.set(p.id, i + 1));
    return map;
  }, [rankedPlayers]);

  const handleAddPlayer = () => {
    if (!activeMatchId) return;
    const newPlayers = [...players, createEmptyPlayer()];
    setPlayersForMatch(activeMatchId, newPlayers);
    setHasChanges(true);
  };

  const handleRemovePlayer = (id: string) => {
    if (!activeMatchId) return;
    const newPlayers = players.filter(p => p.id !== id);
    setPlayersForMatch(activeMatchId, newPlayers);
    setHasChanges(true);
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    if (!activeMatchId) return;
    const newPlayers = players.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates };
      if (updates.agent) {
        updated.role = AGENT_ROLES[updates.agent] || 'Unknown';
      }
      return updated;
    });
    setPlayersForMatch(activeMatchId, newPlayers);
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    // Data is already saved in the store
  };

  const handleBack = () => {
    setActiveMatchId(null);
    setActiveTab('matches');
  };

  if (!activeMatchId || !match) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <Users className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">Selecciona un partido para ver los jugadores</p>
        <button onClick={() => setActiveTab('matches')} className="btn-primary mt-4">
          <ArrowLeft className="w-4 h-4" />
          Volver a Partidos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-semibold">{match.map}</h2>
            <p className="text-sm text-muted-foreground">
              {match.id} · {match.type} · {match.date}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-pro"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <button onClick={handleAddPlayer} className="btn-primary">
            <Plus className="w-4 h-4" />
            Añadir Jugador
          </button>
          
          {hasChanges && (
            <button onClick={handleSave} className="btn-secondary border-green-500/30 text-green-400">
              <Save className="w-4 h-4" />
              Guardar
            </button>
          )}
        </div>
      </div>

      {/* Match Summary */}
      <div className="grid grid-cols-5 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Resultado</p>
          <p className={cn(
            "text-2xl font-bold",
            match.won ? "text-green-400" : "text-red-400"
          )}>
            {match.won ? 'VICTORIA' : 'DERROTA'}
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Score</p>
          <p className="text-2xl font-bold font-mono">
            <span className={match.won ? 'text-green-400' : 'text-red-400'}>{match.scoreUs}</span>
            <span className="text-muted-foreground mx-2">-</span>
            <span className={!match.won ? 'text-green-400' : 'text-red-400'}>{match.scoreOpp}</span>
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Rondas ATK/DEF</p>
          <p className="text-2xl font-bold font-mono">
            <span className="text-yellow-400">{match.atk}</span>
            <span className="text-muted-foreground mx-2">/</span>
            <span className="text-blue-400">{match.def}</span>
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pistolas</p>
          <div className="flex justify-center gap-3">
            <span className={match.pistolAtkWin ? 'text-green-400' : 'text-red-400'}>
              ATK {match.pistolAtkWin ? '✓' : '✗'}
            </span>
            <span className={match.pistolDefWin ? 'text-green-400' : 'text-red-400'}>
              DEF {match.pistolDefWin ? '✓' : '✗'}
            </span>
          </div>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Post/Retake</p>
          <p className="text-lg font-mono">
            <span className="text-green-400">{match.postWin}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-red-400">{match.postLoss}</span>
            <span className="text-muted-foreground mx-2">·</span>
            <span className="text-blue-400">{match.retakeWin}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-red-400">{match.retakeLoss}</span>
          </p>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'hsl(220 15% 20%)' }}>
        <button
          onClick={() => setActiveSubTab('players')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeSubTab === 'players'
              ? "bg-red-500/10 text-red-400 border border-red-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          )}
        >
          <Users className="w-4 h-4" />
          Jugadores
        </button>
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeSubTab === 'timeline'
              ? "bg-red-500/10 text-red-400 border border-red-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          )}
        >
          <Clock className="w-4 h-4" />
          Timeline
        </button>
        <button
          onClick={() => setActiveSubTab('economy')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeSubTab === 'economy'
              ? "bg-red-500/10 text-red-400 border border-red-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          )}
        >
          <DollarSign className="w-4 h-4" />
          Economía
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'timeline' && (
        <MatchTimeline matchId={activeMatchId} />
      )}

      {activeSubTab === 'economy' && (
        <EconomyAnalysis matchId={activeMatchId} />
      )}

      {activeSubTab === 'players' && (
      <>
      {/* Players Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase"
                style={{ background: 'hsl(220 20% 9%)' }}
              >
                <th className="py-3 px-3 w-12">#</th>
                <th className="py-3 px-3">Jugador</th>
                <th className="py-3 px-3">Agente</th>
                <th className="py-3 px-3">K</th>
                <th className="py-3 px-3">D</th>
                <th className="py-3 px-3">A</th>
                <th className="py-3 px-3">K/D</th>
                <th className="py-3 px-3">KDA</th>
                <th className="py-3 px-3">KAST%</th>
                <th className="py-3 px-3">FK</th>
                <th className="py-3 px-3">FD</th>
                <th className="py-3 px-3">ACS</th>
                <th className="py-3 px-3">Plants</th>
                <th className="py-3 px-3">Defuses</th>
                <th className="py-3 px-3">Rating</th>
                <th className="py-3 px-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-muted-foreground">
                    No hay jugadores registrados. Añade jugadores para comenzar.
                  </td>
                </tr>
              ) : (
                players.map((player) => {
                  const rank = rankings.get(player.id) || 0;
                  const kd = calculateKD(player.k, player.d);
                  const kda = calculateKDA(player.k, player.d, player.a);
                  const vlrScore = calculateVLRScore(player);
                  
                  return (
                    <tr key={player.id} className="border-t border-border/50 hover:bg-white/5">
                      <td className="py-2 px-3">
                        <span className={cn(
                          "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                          rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                          rank === 2 ? "bg-gray-400/20 text-gray-400" :
                          rank === 3 ? "bg-orange-600/20 text-orange-400" :
                          "text-muted-foreground"
                        )}>
                          {rank || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handleUpdatePlayer(player.id, { name: e.target.value })}
                          className="input-pro w-32"
                          placeholder="Nombre"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={player.agent}
                          onChange={(e) => handleUpdatePlayer(player.id, { agent: e.target.value })}
                          className="input-pro w-28"
                        >
                          <option value="">-</option>
                          {VALORANT_AGENTS.map(agent => (
                            <option key={agent} value={agent}>{agent}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          value={player.k}
                          onChange={(e) => handleUpdatePlayer(player.id, { k: parseInt(e.target.value) || 0 })}
                          className="input-pro w-16"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          value={player.d}
                          onChange={(e) => handleUpdatePlayer(player.id, { d: parseInt(e.target.value) || 0 })}
                          className="input-pro w-16"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          value={player.a}
                          onChange={(e) => handleUpdatePlayer(player.id, { a: parseInt(e.target.value) || 0 })}
                          className="input-pro w-16"
                        />
                      </td>
                      <td className={cn(
                        "py-2 px-3 font-mono text-sm",
                        kd >= 1.2 ? "text-green-400" :
                        kd >= 1.0 ? "text-yellow-400" :
                        "text-red-400"
                      )}>
                        {kd.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 font-mono text-sm text-muted-foreground">
                        {kda.toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={player.kast}
                          onChange={(e) => handleUpdatePlayer(player.id, { kast: parseInt(e.target.value) || 0 })}
                          className="input-pro w-16"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          value={player.fk}
                          onChange={(e) => handleUpdatePlayer(player.id, { fk: parseInt(e.target.value) || 0 })}
                          className="input-pro w-14"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          value={player.fd}
                          onChange={(e) => handleUpdatePlayer(player.id, { fd: parseInt(e.target.value) || 0 })}
                          className="input-pro w-14"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          value={player.acs}
                          onChange={(e) => handleUpdatePlayer(player.id, { acs: parseInt(e.target.value) || 0 })}
                          className="input-pro w-16"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          value={player.plants}
                          onChange={(e) => handleUpdatePlayer(player.id, { plants: parseInt(e.target.value) || 0 })}
                          className="input-pro w-14"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          value={player.defuses}
                          onChange={(e) => handleUpdatePlayer(player.id, { defuses: parseInt(e.target.value) || 0 })}
                          className="input-pro w-14"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                          {vlrScore.toFixed(0)}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="glass-card p-4">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Consejos de uso</p>
            <p className="text-sm text-muted-foreground mt-1">
              • El rating se calcula automáticamente basado en ACS, KAST, K/D, impacto (FK-FD) y objetivos.<br/>
              • KAST debe introducirse manualmente ya que no se puede deducir de las rondas.<br/>
              • Los jugadores se ordenan automáticamente según el criterio seleccionado.
            </p>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

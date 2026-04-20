import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Users, 
  Target,
  Shield,
  Camera
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { VALORANT_AGENTS, VALORANT_MAPS, type Match, type MatchType, type Player } from '@/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScreenshotImport } from './ScreenshotImport';

interface MatchFormData {
  id: string;
  type: MatchType;
  map: string;
  date: string;
  atk: number;
  def: number;
  scoreUs: number;
  scoreOpp: number;
  otWin: number;
  otLoss: number;
  pistolAtkWin: boolean;
  pistolDefWin: boolean;
  postWin: number;
  postLoss: number;
  retakeWin: number;
  retakeLoss: number;
  notes: string;
}

const defaultFormData: MatchFormData = {
  id: '',
  type: 'SCRIM',
  map: 'Ascent',
  date: new Date().toISOString().split('T')[0],
  atk: 0,
  def: 0,
  scoreUs: 13,
  scoreOpp: 0,
  otWin: 0,
  otLoss: 0,
  pistolAtkWin: false,
  pistolDefWin: false,
  postWin: 0,
  postLoss: 0,
  retakeWin: 0,
  retakeLoss: 0,
  notes: ''
};

function generateMatchId() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().slice(0, 5).replace(':', '');
  return `${date}_${time}_SCRIM`;
}

export function Matches() {
  const { 
    getFilteredMatches, 
    addMatch, 
    updateMatch, 
    deleteMatch, 
    setActiveMatchId,
    setActiveTab,
    filters,
    setFilters 
  } = useAppStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [formData, setFormData] = useState<MatchFormData>(defaultFormData);
  const { setPlayersForMatch } = useAppStore();

  const matches = getFilteredMatches();

  const handleImportFromScreenshot = (data: any) => {
    // Update form data with imported values
    setFormData(prev => ({
      ...prev,
      scoreUs: data.scoreUs ?? prev.scoreUs,
      scoreOpp: data.scoreOpp ?? prev.scoreOpp,
      map: data.map ?? prev.map,
      type: data.type ?? prev.type,
      date: data.date ?? prev.date,
    }));

    // If players were detected, add them to the match
    if (data.players && data.players.length > 0) {
      const players: Player[] = data.players.map((p: any) => ({
        id: crypto.randomUUID(),
        name: p.name,
        agent: p.agent || '',
        role: p.agent ? (VALORANT_AGENTS.includes(p.agent) ? 
          (p.agent === 'Jett' || p.agent === 'Raze' || p.agent === 'Reyna' || p.agent === 'Phoenix' || 
           p.agent === 'Yoru' || p.agent === 'Neon' || p.agent === 'Iso' || p.agent === 'Waylay' ? 'Duelist' :
          p.agent === 'Brimstone' || p.agent === 'Omen' || p.agent === 'Viper' || p.agent === 'Astra' || 
          p.agent === 'Harbor' || p.agent === 'Clove' ? 'Controller' :
          p.agent === 'Sova' || p.agent === 'Breach' || p.agent === 'Skye' || p.agent === 'KAY/O' || 
          p.agent === 'Fade' || p.agent === 'Gekko' || p.agent === 'Tejo' ? 'Initiator' : 'Sentinel') : 'Unknown') : 'Unknown',
        k: p.k ?? 0,
        d: p.d ?? 0,
        a: p.a ?? 0,
        kast: 0,
        fk: p.fk ?? 0,
        fd: 0,
        acs: p.acs ?? 0,
        plants: p.plants ?? 0,
        defuses: p.defuses ?? 0
      }));

      // We'll store the players temporarily and add them when the match is saved
      setPendingPlayers(players);
    }

    setIsImportDialogOpen(false);
    setIsDialogOpen(true);
  };

  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);

  const handleOpenDialog = (match?: Match) => {
    if (match) {
      setEditingMatch(match);
      setFormData({
        id: match.id,
        type: match.type,
        map: match.map,
        date: match.date,
        atk: match.atk,
        def: match.def,
        scoreUs: match.scoreUs,
        scoreOpp: match.scoreOpp,
        otWin: match.otWin,
        otLoss: match.otLoss,
        pistolAtkWin: match.pistolAtkWin,
        pistolDefWin: match.pistolDefWin,
        postWin: match.postWin,
        postLoss: match.postLoss,
        retakeWin: match.retakeWin,
        retakeLoss: match.retakeLoss,
        notes: match.notes || ''
      });
    } else {
      setEditingMatch(null);
      setFormData({ ...defaultFormData, id: generateMatchId() });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const match: Match = {
      ...formData,
      won: formData.scoreUs > formData.scoreOpp,
      createdAt: editingMatch?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    if (editingMatch) {
      updateMatch(match.id, match);
    } else {
      addMatch(match);
      // Add pending players if any
      if (pendingPlayers.length > 0) {
        setPlayersForMatch(match.id, pendingPlayers);
        setPendingPlayers([]);
      }
    }
    setIsDialogOpen(false);
    setFormData(defaultFormData);
    setEditingMatch(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este partido?')) {
      deleteMatch(id);
    }
  };

  const handleOpenPlayers = (matchId: string) => {
    setActiveMatchId(matchId);
    setActiveTab('players');
  };

  const kpis = useMemo(() => {
    const total = matches.length;
    const wins = matches.filter(m => m.won).length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
    
    const byMap: Record<string, number> = {};
    matches.forEach(m => {
      byMap[m.map] = (byMap[m.map] || 0) + 1;
    });
    const topMap = Object.entries(byMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    
    return { total, wins, winRate, topMap };
  }, [matches]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar partidos..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="input-pro pl-10 w-64"
            />
          </div>
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
        
        <div className="flex gap-2">
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Importar Captura
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="btn-primary">
                <Plus className="w-4 h-4" />
                Nuevo Partido
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto"
            style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 15% 20%)' }}
          >
            <DialogHeader>
              <DialogTitle>{editingMatch ? 'Editar Partido' : 'Nuevo Partido'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Match ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="input-pro"
                    placeholder="ID del partido"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as MatchType })}
                    className="input-pro"
                  >
                    <option value="SCRIM">SCRIM</option>
                    <option value="PREMIER">PREMIER</option>
                    <option value="OFICIAL">OFICIAL</option>
                    <option value="TOURNAMENT">Torneo</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Mapa</label>
                  <select
                    value={formData.map}
                    onChange={(e) => setFormData({ ...formData, map: e.target.value })}
                    className="input-pro"
                  >
                    {VALORANT_MAPS.map(map => (
                      <option key={map} value={map}>{map}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-pro"
                />
              </div>

              {/* Score */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Nuestro Score</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.scoreUs}
                    onChange={(e) => setFormData({ ...formData, scoreUs: parseInt(e.target.value) || 0 })}
                    className="input-pro"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Rival Score</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.scoreOpp}
                    onChange={(e) => setFormData({ ...formData, scoreOpp: parseInt(e.target.value) || 0 })}
                    className="input-pro"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">OT Ganados</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.otWin}
                    onChange={(e) => setFormData({ ...formData, otWin: parseInt(e.target.value) || 0 })}
                    className="input-pro"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">OT Perdidos</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.otLoss}
                    onChange={(e) => setFormData({ ...formData, otLoss: parseInt(e.target.value) || 0 })}
                    className="input-pro"
                  />
                </div>
              </div>

              {/* Rounds */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Rondas ATK Ganadas</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.atk}
                    onChange={(e) => setFormData({ ...formData, atk: parseInt(e.target.value) || 0 })}
                    className="input-pro"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Rondas DEF Ganadas</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.def}
                    onChange={(e) => setFormData({ ...formData, def: parseInt(e.target.value) || 0 })}
                    className="input-pro"
                  />
                </div>
              </div>

              {/* Pistols */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderColor: 'hsl(220 15% 20%)', background: 'hsl(220 20% 9%)' }}
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm">Pistolas ATK Ganadas</span>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, pistolAtkWin: !formData.pistolAtkWin })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      formData.pistolAtkWin ? "bg-green-500" : "bg-gray-600"
                    )}
                  >
                    <span className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      formData.pistolAtkWin ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderColor: 'hsl(220 15% 20%)', background: 'hsl(220 20% 9%)' }}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="text-sm">Pistolas DEF Ganadas</span>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, pistolDefWin: !formData.pistolDefWin })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      formData.pistolDefWin ? "bg-green-500" : "bg-gray-600"
                    )}
                  >
                    <span className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      formData.pistolDefWin ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>

              {/* Postplant & Retake */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Postplant W</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.postWin}
                    onChange={(e) => setFormData({ ...formData, postWin: parseInt(e.target.value) || 0 })}
                    className="input-pro"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Postplant L</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.postLoss}
                    onChange={(e) => setFormData({ ...formData, postLoss: parseInt(e.target.value) || 0 })}
                    className="input-pro"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Retake W</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.retakeWin}
                    onChange={(e) => setFormData({ ...formData, retakeWin: parseInt(e.target.value) || 0 })}
                    className="input-pro"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Retake L</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.retakeLoss}
                    onChange={(e) => setFormData({ ...formData, retakeLoss: parseInt(e.target.value) || 0 })}
                    className="input-pro"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-pro w-full h-20 resize-none"
                  placeholder="Notas adicionales sobre el partido..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="btn-primary">
                  {editingMatch ? 'Guardar Cambios' : 'Crear Partido'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Partidos</p>
          <p className="text-2xl font-bold">{kpis.total}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Victorias</p>
          <p className="text-2xl font-bold text-green-400">{kpis.wins}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
          <p className="text-2xl font-bold">{kpis.winRate}%</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Mapa Más Jugado</p>
          <p className="text-2xl font-bold">{kpis.topMap}</p>
        </div>
      </div>

      {/* Matches Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase"
                style={{ background: 'hsl(220 20% 9%)' }}
              >
                <th className="py-3 px-4">Resultado</th>
                <th className="py-3 px-4">Match ID</th>
                <th className="py-3 px-4">Mapa</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">ATK/DEF</th>
                <th className="py-3 px-4">Pistolas</th>
                <th className="py-3 px-4">Post/Retake</th>
                <th className="py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No hay partidos registrados
                  </td>
                </tr>
              ) : (
                matches.map((match) => (
                  <tr key={match.id} className="border-t border-border/50 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        match.won 
                          ? "bg-green-500/10 text-green-400" 
                          : "bg-red-500/10 text-red-400"
                      )}>
                        {match.won ? 'VICTORIA' : 'DERROTA'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{match.id}</td>
                    <td className="py-3 px-4">{match.map}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs"
                        style={{ 
                          background: match.type === 'SCRIM' ? 'hsl(355 85% 58% / 0.15)' :
                                     match.type === 'PREMIER' ? 'hsl(217 90% 55% / 0.15)' :
                                     'hsl(142 71% 45% / 0.15)',
                          color: match.type === 'SCRIM' ? 'hsl(355 85% 65%)' :
                                 match.type === 'PREMIER' ? 'hsl(217 90% 65%)' :
                                 'hsl(142 71% 55%)'
                        }}
                      >
                        {match.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={match.won ? 'text-green-400' : 'text-red-400'}>
                        {match.scoreUs}
                      </span>
                      <span className="text-muted-foreground mx-1">-</span>
                      <span className={!match.won ? 'text-green-400' : 'text-red-400'}>
                        {match.scoreOpp}
                      </span>
                      {(match.otWin > 0 || match.otLoss > 0) && (
                        <span className="text-xs text-muted-foreground ml-1">
                          OT({match.otWin}-{match.otLoss})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">
                      <span className="text-yellow-400">{match.atk}</span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span className="text-blue-400">{match.def}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <span className={cn(
                          "text-xs",
                          match.pistolAtkWin ? "text-green-400" : "text-red-400"
                        )}>
                          ATK {match.pistolAtkWin ? '✓' : '✗'}
                        </span>
                        <span className={cn(
                          "text-xs",
                          match.pistolDefWin ? "text-green-400" : "text-red-400"
                        )}>
                          DEF {match.pistolDefWin ? '✓' : '✗'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      <span className="text-green-400">{match.postWin}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-400">{match.postLoss}</span>
                      <span className="text-muted-foreground mx-1">·</span>
                      <span className="text-blue-400">{match.retakeWin}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-400">{match.retakeLoss}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenPlayers(match.id)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title="Ver jugadores"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDialog(match)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(match.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screenshot Import Dialog */}
      <ScreenshotImport
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportFromScreenshot}
      />
      </div>
    </div>
  );
}

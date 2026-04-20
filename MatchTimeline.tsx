import { useState } from 'react';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Shield,
  Zap,
  DollarSign,
  Bomb,
  Skull,
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { type Round, type Side, type BuyType, type RoundOutcome } from '@/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MatchTimelineProps {
  matchId: string;
}

const buyTypeConfig: Record<BuyType, { label: string; color: string; bg: string }> = {
  ECO: { label: 'ECO', color: 'text-red-400', bg: 'bg-red-500/10' },
  FORCE: { label: 'Force', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  FULL: { label: 'Full', color: 'text-green-400', bg: 'bg-green-500/10' },
  OVERTIME: { label: 'OT', color: 'text-purple-400', bg: 'bg-purple-500/10' }
};

const sideConfig: Record<Side, { label: string; icon: typeof Target; color: string }> = {
  ATK: { label: 'Ataque', icon: Target, color: 'text-yellow-400' },
  DEF: { label: 'Defensa', icon: Shield, color: 'text-blue-400' }
};

function RoundCard({ 
  round, 
  onEdit, 
  onDelete 
}: { 
  round: Round; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const buyConfig = buyTypeConfig[round.buyType];
  const sideConfig_item = sideConfig[round.side];
  const SideIcon = sideConfig_item.icon;
  
  const isWin = round.outcome === 'WIN';
  const isLoss = round.outcome === 'LOSS';

  return (
    <div className={cn(
      "relative rounded-xl border overflow-hidden transition-all",
      isWin ? "border-green-500/30 bg-green-500/5" :
      isLoss ? "border-red-500/30 bg-red-500/5" :
      "border-yellow-500/30 bg-yellow-500/5"
    )}>
      {/* Header - Always visible */}
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Round Number */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
          isWin ? "bg-green-500/20 text-green-400" :
          isLoss ? "bg-red-500/20 text-red-400" :
          "bg-yellow-500/20 text-yellow-400"
        )}>
          {round.roundNumber}
        </div>

        {/* Side */}
        <div className={cn("p-2 rounded-lg bg-white/5", sideConfig_item.color)}>
          <SideIcon className="w-4 h-4" />
        </div>

        {/* Buy Type */}
        <span className={cn("px-2 py-1 rounded text-xs font-medium", buyConfig.bg, buyConfig.color)}>
          {buyConfig.label}
        </span>

        {/* Outcome */}
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ml-auto",
          isWin ? "bg-green-500/20 text-green-400" :
          isLoss ? "bg-red-500/20 text-red-400" :
          "bg-yellow-500/20 text-yellow-400"
        )}>
          {isWin ? <TrendingUp className="w-3 h-3" /> :
           isLoss ? <TrendingDown className="w-3 h-3" /> :
           <Minus className="w-3 h-3" />}
          {isWin ? 'Victoria' : isLoss ? 'Derrota' : 'Empate'}
        </div>

        {/* Economy */}
        <div className="flex items-center gap-1 text-sm">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className={cn(
            round.economyUs >= 4000 ? "text-green-400" :
            round.economyUs >= 2000 ? "text-yellow-400" :
            "text-red-400"
          )}>
            ${round.economyUs.toLocaleString()}
          </span>
        </div>

        {/* Kills */}
        <div className="flex items-center gap-1 text-sm">
          <Skull className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono">{round.killsUs}-{round.killsOpp}</span>
        </div>

        {/* Expand Icon */}
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-white/10">
          <div className="pt-3 space-y-3">
            {/* Key Info Grid */}
            <div className="grid grid-cols-4 gap-3">
              {round.bombPlanted && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm">
                  <Bomb className="w-4 h-4" />
                  <span>Bomba plantada</span>
                </div>
              )}
              {round.bombDefused && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Bomba defusada</span>
                </div>
              )}
              {round.clutchWon && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 text-purple-400 text-sm">
                  <Trophy className="w-4 h-4" />
                  <span>Clutch {round.clutchSituation}</span>
                </div>
              )}
            </div>

            {/* Key Moments */}
            {round.keyMoments && round.keyMoments.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Momentos clave</p>
                <div className="space-y-1">
                  {round.keyMoments.map((moment, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span>{moment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {round.notes && (
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-xs text-muted-foreground mb-1">Notas</p>
                <p className="text-sm">{round.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={onEdit} variant="outline" size="sm" className="flex items-center gap-2">
                <Edit2 className="w-3 h-3" />
                Editar
              </Button>
              <Button onClick={onDelete} variant="outline" size="sm" className="flex items-center gap-2 text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-3 h-3" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoundForm({ 
  round, 
  onSave, 
  onCancel 
}: { 
  round?: Round; 
  onSave: (round: Round) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Round>>(round || {
    roundNumber: 1,
    side: 'ATK',
    outcome: 'WIN',
    buyType: 'FULL',
    opponentBuyType: 'FULL',
    killsUs: 5,
    killsOpp: 0,
    bombPlanted: false,
    bombDefused: false,
    economyUs: 4000,
    economyOpp: 4000,
    keyMoments: [],
    notes: ''
  });

  const handleSave = () => {
    onSave(formData as Round);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Ronda #</label>
          <input
            type="number"
            min={1}
            value={formData.roundNumber}
            onChange={(e) => setFormData({ ...formData, roundNumber: parseInt(e.target.value) })}
            className="input-pro w-full"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Lado</label>
          <select
            value={formData.side}
            onChange={(e) => setFormData({ ...formData, side: e.target.value as Side })}
            className="input-pro w-full"
          >
            <option value="ATK">Ataque</option>
            <option value="DEF">Defensa</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Resultado</label>
          <select
            value={formData.outcome}
            onChange={(e) => setFormData({ ...formData, outcome: e.target.value as RoundOutcome })}
            className="input-pro w-full"
          >
            <option value="WIN">Victoria</option>
            <option value="LOSS">Derrota</option>
            <option value="DRAW">Empate</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Tipo de Compra</label>
          <select
            value={formData.buyType}
            onChange={(e) => setFormData({ ...formData, buyType: e.target.value as BuyType })}
            className="input-pro w-full"
          >
            <option value="ECO">ECO</option>
            <option value="FORCE">Force Buy</option>
            <option value="FULL">Full Buy</option>
            <option value="OVERTIME">Overtime</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Nuestras kills</label>
          <input
            type="number"
            min={0}
            max={5}
            value={formData.killsUs}
            onChange={(e) => setFormData({ ...formData, killsUs: parseInt(e.target.value) })}
            className="input-pro w-full"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Kills rival</label>
          <input
            type="number"
            min={0}
            max={5}
            value={formData.killsOpp}
            onChange={(e) => setFormData({ ...formData, killsOpp: parseInt(e.target.value) })}
            className="input-pro w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Nuestra economía</label>
          <input
            type="number"
            min={0}
            value={formData.economyUs}
            onChange={(e) => setFormData({ ...formData, economyUs: parseInt(e.target.value) })}
            className="input-pro w-full"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Economía rival</label>
          <input
            type="number"
            min={0}
            value={formData.economyOpp}
            onChange={(e) => setFormData({ ...formData, economyOpp: parseInt(e.target.value) })}
            className="input-pro w-full"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.bombPlanted}
            onChange={(e) => setFormData({ ...formData, bombPlanted: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Bomba plantada</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.bombDefused}
            onChange={(e) => setFormData({ ...formData, bombDefused: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Bomba defusada</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.clutchWon}
            onChange={(e) => setFormData({ ...formData, clutchWon: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Clutch ganado</span>
        </label>
      </div>

      {formData.clutchWon && (
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Situación del clutch</label>
          <input
            type="text"
            value={formData.clutchSituation || ''}
            onChange={(e) => setFormData({ ...formData, clutchSituation: e.target.value })}
            className="input-pro w-full"
            placeholder="ej: 1v3"
          />
        </div>
      )}

      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Notas</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="input-pro w-full h-20 resize-none"
          placeholder="Notas sobre esta ronda..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={onCancel} variant="outline">Cancelar</Button>
        <Button onClick={handleSave} className="btn-primary">Guardar Ronda</Button>
      </div>
    </div>
  );
}

export function MatchTimeline({ matchId }: MatchTimelineProps) {
  const { matches, addRound, updateRound, removeRound, calculateEconomyStats } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);

  const match = matches[matchId];
  const rounds = match?.rounds || [];

  // Sort rounds by number
  const sortedRounds = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);

  const handleAddRound = () => {
    setEditingRound(null);
    setIsDialogOpen(true);
  };

  const handleEditRound = (round: Round) => {
    setEditingRound(round);
    setIsDialogOpen(true);
  };

  const handleSaveRound = (roundData: Round) => {
    if (editingRound) {
      updateRound(matchId, editingRound.roundNumber, roundData);
    } else {
      addRound(matchId, roundData);
    }
    calculateEconomyStats(matchId);
    setIsDialogOpen(false);
    setEditingRound(null);
  };

  const handleDeleteRound = (roundNumber: number) => {
    if (confirm('¿Eliminar esta ronda?')) {
      removeRound(matchId, roundNumber);
      calculateEconomyStats(matchId);
    }
  };

  // Calculate stats
  const wins = rounds.filter(r => r.outcome === 'WIN').length;
  const losses = rounds.filter(r => r.outcome === 'LOSS').length;
  const winStreak = sortedRoundStreak(sortedRounds, 'WIN');
  const lossStreak = sortedRoundStreak(sortedRounds, 'LOSS');

  function sortedRoundStreak(rounds: Round[], outcome: RoundOutcome): number {
    let maxStreak = 0;
    let currentStreak = 0;
    for (const round of rounds) {
      if (round.outcome === outcome) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Rondas Registradas</p>
          <p className="text-2xl font-bold">{rounds.length}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Victorias</p>
          <p className="text-2xl font-bold text-green-400">{wins}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Derrotas</p>
          <p className="text-2xl font-bold text-red-400">{losses}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Mejor Racha</p>
          <p className="text-2xl font-bold text-yellow-400">{Math.max(winStreak, lossStreak)}</p>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={handleAddRound} className="btn-primary">
          <Plus className="w-4 h-4" />
          Añadir Ronda
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {sortedRounds.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay rondas registradas</p>
            <p className="text-sm mt-1">Añade rondas para ver el timeline del partido</p>
          </div>
        ) : (
          sortedRounds.map((round) => (
            <RoundCard
              key={round.roundNumber}
              round={round}
              onEdit={() => handleEditRound(round)}
              onDelete={() => handleDeleteRound(round.roundNumber)}
            />
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg"
          style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 15% 20%)' }}
        >
          <DialogHeader>
            <DialogTitle>{editingRound ? 'Editar Ronda' : 'Nueva Ronda'}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <RoundForm
              round={editingRound || undefined}
              onSave={handleSaveRound}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingRound(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Play,
  Pause,
  Square,
  Plus,
  MessageSquare,
  Trophy,
  AlertTriangle,
  ThumbsUp,
  Phone,
  MoreHorizontal,
  Download,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useSpectatorStore } from '@/store/spectatorStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuickNote } from '@/types/spectator';

const NOTE_CATEGORIES: { value: QuickNote['category']; label: string; icon: typeof Trophy; color: string }[] = [
  { value: 'TACTIC', label: 'Táctica', icon: Trophy, color: 'text-blue-400' },
  { value: 'MISTAKE', label: 'Error', icon: AlertTriangle, color: 'text-red-400' },
  { value: 'GOOD_PLAY', label: 'Buena Jugada', icon: ThumbsUp, color: 'text-green-400' },
  { value: 'CALL', label: 'Comunicación', icon: Phone, color: 'text-yellow-400' },
  { value: 'OTHER', label: 'Otro', icon: MoreHorizontal, color: 'text-gray-400' },
];

const QUICK_NOTES = [
  'ECO round - mala decisión',
  'Buen execute',
  'Problema de comunicación',
  'Overpeek',
  'Rotación lenta',
  'Utility wasted',
  'Buen trade',
  'Timing perfecto',
];

export function SpectatorMode() {
  const [isActive, setIsActive] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [currentRound, setCurrentRound] = useState(1);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuickNote['category']>('TACTIC');
  const [noteContent, setNoteContent] = useState('');
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const {
    activateMode,
    deactivateMode,
    addNote,
    getNotesByRound,
  } = useSpectatorStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleActivate = () => {
    if (!selectedMatchId) return;
    setIsActive(true);
    activateMode(selectedMatchId);
    setIsTimerRunning(true);
  };

  const handleDeactivate = () => {
    setIsActive(false);
    setIsTimerRunning(false);
    deactivateMode();
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;

    addNote({
      matchId: selectedMatchId,
      round: currentRound,
      category: selectedCategory,
      content: noteContent,
    });

    setNoteContent('');
    setShowNoteDialog(false);
  };

  const handleQuickNote = (content: string) => {
    addNote({
      matchId: selectedMatchId,
      round: currentRound,
      category: 'OTHER',
      content,
    });
  };

  const roundNotes = getNotesByRound(selectedMatchId, currentRound);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-[#ff4655]" />
            Modo Espectador
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Herramienta para coaches durante partidos en vivo
          </p>
        </div>

        {/* Setup */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Configurar Sesión</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">ID del Partido</label>
              <input
                type="text"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                placeholder="Ej: match-001"
                className="w-full px-3 py-2 bg-[#0f0f1e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Ronda Inicial</label>
              <input
                type="number"
                value={currentRound}
                onChange={(e) => setCurrentRound(parseInt(e.target.value) || 1)}
                min={1}
                max={24}
                className="w-full px-3 py-2 bg-[#0f0f1e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
              />
            </div>
            <Button
              onClick={handleActivate}
              disabled={!selectedMatchId}
              className="w-full bg-[#ff4655] hover:bg-[#ff6b7a] text-white disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Modo Espectador
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4">
            <MessageSquare className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-white font-medium">Notas Rápidas</h4>
            <p className="text-gray-500 text-sm mt-1">
              Añade notas durante el partido con atajos de teclado
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <Eye className="w-8 h-8 text-green-400 mb-3" />
            <h4 className="text-white font-medium">Timer de Ronda</h4>
            <p className="text-gray-500 text-sm mt-1">
              Cronómetro para seguir el tiempo de cada ronda
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <Download className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="text-white font-medium">Exportar Notas</h4>
            <p className="text-gray-500 text-sm mt-1">
              Exporta todas las notas al finalizar el partido
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active Spectator Mode UI
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Bar */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentRound((r) => Math.max(1, r - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-2xl font-bold text-white min-w-[60px] text-center">
                R{currentRound}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentRound((r) => r + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="h-8 w-px bg-[#2a2a3e]" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
              >
                {isTimerRunning ? (
                  <Pause className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Play className="w-5 h-5 text-green-400" />
                )}
              </button>
              <span className={cn('text-xl font-mono', isTimerRunning ? 'text-white' : 'text-gray-500')}>
                {formatTime(timer)}
              </span>
              <button
                onClick={() => setTimer(0)}
                className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
              >
                <Square className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeactivate}
            >
              <Square className="w-4 h-4 mr-1" />
              Finalizar
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Notes Grid */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Notas Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_NOTES.map((note) => (
            <button
              key={note}
              onClick={() => handleQuickNote(note)}
              className="p-2 bg-[#0f0f1e] hover:bg-[#1a1a2e] rounded-lg text-sm text-gray-300 transition-colors text-left"
            >
              {note}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setShowNoteDialog(true)}
          variant="outline"
          className="w-full mt-3"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nota Personalizada
        </Button>
      </div>

      {/* Category Shortcuts */}
      <div className="grid grid-cols-5 gap-2">
        {NOTE_CATEGORIES.map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            onClick={() => {
              setSelectedCategory(value);
              setShowNoteDialog(true);
            }}
            className="glass-card rounded-lg p-3 hover:bg-[#1a1a2e] transition-colors"
          >
            <Icon className={cn('w-5 h-5 mx-auto mb-1', color)} />
            <span className="text-xs text-gray-400">{label}</span>
          </button>
        ))}
      </div>

      {/* Round Notes */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400">
            Notas de la Ronda {currentRound}
          </h3>
          <span className="text-xs text-gray-500">{roundNotes.length} notas</span>
        </div>
        {roundNotes.length === 0 ? (
          <p className="text-gray-600 text-center py-4">Sin notas en esta ronda</p>
        ) : (
          <div className="space-y-2">
            {roundNotes.map((note) => {
              const category = NOTE_CATEGORIES.find((c) => c.value === note.category);
              const Icon = category?.icon || MoreHorizontal;
              return (
                <div
                  key={note.id}
                  className="flex items-start gap-2 p-2 bg-[#0f0f1e] rounded-lg"
                >
                  <Icon className={cn('w-4 h-4 mt-0.5', category?.color)} />
                  <div className="flex-1">
                    <p className="text-white text-sm">{note.content}</p>
                    <p className="text-gray-600 text-xs">
                      {new Date(note.timestamp).toLocaleTimeString('es-ES')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="bg-[#0f0f1e] border-[#1a1a2e] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir Nota - Ronda {currentRound}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {NOTE_CATEGORIES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedCategory(value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors',
                      selectedCategory === value
                        ? 'bg-[#ff4655] text-white'
                        : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Contenido</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={3}
                placeholder="Escribe tu nota..."
                className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none resize-none"
                autoFocus
              />
            </div>
            <Button onClick={handleAddNote} className="w-full bg-[#ff4655] hover:bg-[#ff6b7a]">
              Añadir Nota
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

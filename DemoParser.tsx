import { useState, useRef } from 'react';
import {
  FileJson,
  Upload,
  Clock,
  Map as MapIcon,
  Target,
  Zap,
  X,
  Loader2,
  Download,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface DemoParseResult {
  map: string;
  duration: number;
  rounds: DemoRound[];
  players: DemoPlayer[];
  keyMoments: KeyMoment[];
}

interface DemoRound {
  roundNumber: number;
  winner: 'ATK' | 'DEF';
  scoreATK: number;
  scoreDEF: number;
  duration: number;
  firstKill?: number;
  spikePlant?: number;
  keyEvents: DemoEvent[];
}

interface DemoPlayer {
  name: string;
  agent: string;
  team: 'ATK' | 'DEF';
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  adr: number;
  positions: PositionData[];
}

interface PositionData {
  time: number;
  x: number;
  y: number;
  action?: string;
}

interface DemoEvent {
  time: number;
  type: 'KILL' | 'UTILITY' | 'SPIKE_PLANT' | 'SPIKE_DEFUSE' | 'ROTATION';
  player?: string;
  target?: string;
  description: string;
}

interface KeyMoment {
  round: number;
  time: number;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function DemoParser() {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [result, setResult] = useState<DemoParseResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.dem')) {
      await parseDemo(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.dem')) {
      await parseDemo(file);
    }
  };

  const parseDemo = async (_file: File) => {
    setIsParsing(true);
    setParseProgress(0);

    // Simulate parsing progress
    const progressInterval = setInterval(() => {
      setParseProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    // In a real implementation, this would parse the .dem file
    // For now, we'll simulate a result after a delay
    setTimeout(() => {
      clearInterval(progressInterval);
      setParseProgress(100);
      
      // Simulated result
      const simulatedResult: DemoParseResult = {
        map: 'Ascent',
        duration: 2340,
        rounds: Array.from({ length: 24 }, (_, i) => ({
          roundNumber: i + 1,
          winner: i % 3 === 0 ? 'ATK' : 'DEF',
          scoreATK: Math.floor(i / 2) + (i % 2),
          scoreDEF: Math.floor(i / 2) + (i % 2 === 0 ? 0 : 1),
          duration: 85 + Math.random() * 40,
          firstKill: 15 + Math.random() * 30,
          spikePlant: 45 + Math.random() * 40,
          keyEvents: [
            { time: 20, type: 'KILL', player: 'Player1', target: 'Enemy1', description: 'Opening kill A main' },
            { time: 50, type: 'SPIKE_PLANT', player: 'Player2', description: 'Spike planted A site' },
          ],
        })),
        players: [
          { name: 'Player1', agent: 'Jett', team: 'ATK', kills: 18, deaths: 12, assists: 4, acs: 245, adr: 152, positions: [] },
          { name: 'Player2', agent: 'Omen', team: 'ATK', kills: 15, deaths: 14, assists: 8, acs: 210, adr: 128, positions: [] },
          { name: 'Player3', agent: 'Sova', team: 'ATK', kills: 12, deaths: 13, assists: 12, acs: 195, adr: 115, positions: [] },
          { name: 'Enemy1', agent: 'Chamber', team: 'DEF', kills: 16, deaths: 15, assists: 3, acs: 228, adr: 142, positions: [] },
        ],
        keyMoments: [
          { round: 5, time: 120, description: '1v3 clutch won', impact: 'HIGH' },
          { round: 12, time: 580, description: 'Eco round win with pistols', impact: 'HIGH' },
          { round: 18, time: 920, description: '5v3 advantage lost', impact: 'MEDIUM' },
        ],
      };

      setResult(simulatedResult);
      setShowResultDialog(true);
      setIsParsing(false);
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportToJSON = () => {
    if (!result) return;
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `demo_analysis_${result.map}_${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileJson className="w-7 h-7 text-[#ff4655]" />
            Demo Parser
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Analiza archivos .dem de Valorant para extraer datos detallados
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {!result && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'glass-card rounded-xl p-12 text-center cursor-pointer transition-all',
            isDragging && 'border-[#ff4655] bg-[#ff4655]/10 scale-[1.02]',
            !isDragging && 'hover:border-[#ff4655]/50 hover:bg-[#ff4655]/5',
            'border-2 border-dashed border-[#2a2a3e]'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".dem"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isParsing ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 text-[#ff4655] mx-auto animate-spin" />
              <p className="text-white font-medium">Analizando demo...</p>
              <div className="w-64 h-2 bg-[#1a1a2e] rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-[#ff4655] transition-all duration-300"
                  style={{ width: `${parseProgress}%` }}
                />
              </div>
              <p className="text-gray-500 text-sm">{parseProgress}% completado</p>
              <p className="text-gray-600 text-xs">Extrayendo posiciones, kills, utilidad...</p>
            </div>
          ) : (
            <>
              <Upload className={cn(
                'w-12 h-12 mx-auto mb-4 transition-colors',
                isDragging ? 'text-[#ff4655]' : 'text-gray-500'
              )} />
              <p className="text-white font-medium mb-2">
                Arrastra un archivo .dem o haz click para seleccionar
              </p>
              <p className="text-gray-500 text-sm">
                Soporta archivos de demo de Valorant (.dem)
              </p>
              <p className="text-gray-600 text-xs mt-2">
                Los archivos .dem se encuentran en: <code className="bg-[#1a1a2e] px-1 rounded">%LOCALAPPDATA%\VALORANT\Saved\Demos</code>
              </p>
            </>
          )}
        </div>
      )}

      {/* Info Card */}
      {!result && !isParsing && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#ff4655]" />
            Qué extrae el parser
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0f0f1e] rounded-lg p-4">
              <MapIcon className="w-6 h-6 text-blue-400 mb-2" />
              <p className="text-white font-medium">Posiciones</p>
              <p className="text-gray-500 text-sm">Tracking de movimiento cada 0.1s</p>
            </div>
            <div className="bg-[#0f0f1e] rounded-lg p-4">
              <Target className="w-6 h-6 text-red-400 mb-2" />
              <p className="text-white font-medium">Kills & Daño</p>
              <p className="text-gray-500 text-sm">Timings y posiciones de kills</p>
            </div>
            <div className="bg-[#0f0f1e] rounded-lg p-4">
              <Zap className="w-6 h-6 text-yellow-400 mb-2" />
              <p className="text-white font-medium">Utilidad</p>
              <p className="text-gray-500 text-sm">Uso de flashes, smokes, mollies</p>
            </div>
            <div className="bg-[#0f0f1e] rounded-lg p-4">
              <Clock className="w-6 h-6 text-green-400 mb-2" />
              <p className="text-white font-medium">Timings</p>
              <p className="text-gray-500 text-sm">First kill, spike plant, rotaciones</p>
            </div>
          </div>
        </div>
      )}

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="bg-[#0f0f1e] border-[#1a1a2e] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Análisis de Demo - {result?.map}</span>
              <Button onClick={exportToJSON} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Exportar JSON
              </Button>
            </DialogTitle>
          </DialogHeader>

          {result && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">Duración</p>
                  <p className="text-white font-bold">{formatTime(result.duration)}</p>
                </div>
                <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">Rondas</p>
                  <p className="text-white font-bold">{result.rounds.length}</p>
                </div>
                <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">Jugadores</p>
                  <p className="text-white font-bold">{result.players.length}</p>
                </div>
                <div className="bg-[#1a1a2e] rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs">Momentos Clave</p>
                  <p className="text-white font-bold">{result.keyMoments.length}</p>
                </div>
              </div>

              {/* Key Moments */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Momentos Clave</h3>
                <div className="space-y-2">
                  {result.keyMoments.map((moment, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg',
                        moment.impact === 'HIGH' ? 'bg-red-500/10 border border-red-500/30' :
                        moment.impact === 'MEDIUM' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                        'bg-[#1a1a2e]'
                      )}
                    >
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        moment.impact === 'HIGH' ? 'bg-red-500 text-white' :
                        moment.impact === 'MEDIUM' ? 'bg-yellow-500 text-black' :
                        'bg-gray-500 text-white'
                      )}>
                        {moment.impact}
                      </span>
                      <span className="text-gray-400 text-sm">R{moment.round}</span>
                      <span className="text-white">{moment.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Players */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Estadísticas de Jugadores</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-500 text-xs">
                        <th className="text-left p-2">Jugador</th>
                        <th className="text-center p-2">Agente</th>
                        <th className="text-center p-2">K</th>
                        <th className="text-center p-2">D</th>
                        <th className="text-center p-2">A</th>
                        <th className="text-center p-2">ACS</th>
                        <th className="text-center p-2">ADR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.players.map((player, idx) => (
                        <tr key={idx} className="border-t border-[#1a1a2e]">
                          <td className="p-2 text-white">{player.name}</td>
                          <td className="p-2 text-center text-gray-400">{player.agent}</td>
                          <td className="p-2 text-center text-green-400">{player.kills}</td>
                          <td className="p-2 text-center text-red-400">{player.deaths}</td>
                          <td className="p-2 text-center text-blue-400">{player.assists}</td>
                          <td className="p-2 text-center text-white font-medium">{player.acs}</td>
                          <td className="p-2 text-center text-gray-400">{player.adr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rounds */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Rondas</h3>
                <div className="grid grid-cols-6 gap-2">
                  {result.rounds.map((round) => (
                    <button
                      key={round.roundNumber}
                      onClick={() => setSelectedRound(round.roundNumber)}
                      className={cn(
                        'p-2 rounded-lg text-center transition-colors',
                        round.winner === 'ATK' ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-blue-500/20 hover:bg-blue-500/30',
                        selectedRound === round.roundNumber && 'ring-2 ring-[#ff4655]'
                      )}
                    >
                      <p className="text-xs text-gray-500">R{round.roundNumber}</p>
                      <p className={cn(
                        'text-sm font-bold',
                        round.winner === 'ATK' ? 'text-red-400' : 'text-blue-400'
                      )}>
                        {round.scoreATK}-{round.scoreDEF}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Round Detail */}
              {selectedRound && (
                <div className="bg-[#1a1a2e] rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">
                    Detalle Ronda {selectedRound}
                  </h4>
                  {result.rounds.find((r) => r.roundNumber === selectedRound)?.keyEvents.map((event, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm py-1">
                      <span className="text-gray-500">{formatTime(event.time)}</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs',
                        event.type === 'KILL' ? 'bg-red-500/20 text-red-400' :
                        event.type === 'SPIKE_PLANT' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      )}>
                        {event.type}
                      </span>
                      <span className="text-gray-300">{event.description}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => {
                  setResult(null);
                  setShowResultDialog(false);
                  setSelectedRound(null);
                }}
                className="w-full bg-[#ff4655] hover:bg-[#ff6b7a]"
              >
                <X className="w-4 h-4 mr-2" />
                Cerrar y Analizar Otro
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

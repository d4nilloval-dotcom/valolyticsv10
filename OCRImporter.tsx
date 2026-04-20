import { useState, useRef, useCallback } from 'react';
import {
  Camera,
  Scan,
  AlertCircle,
  RefreshCw,
  Edit2,
  Save,
  X,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { VALORANT_MAPS, AGENT_ROLES } from '@/types';
// Match type is used implicitly

interface DetectedPlayer {
  name: string;
  agent?: string;
  k?: number;
  d?: number;
  a?: number;
  acs?: number;
  confidence: number;
}

interface DetectedScoreboard {
  map?: string;
  scoreUs?: number;
  scoreThem?: number;
  players: DetectedPlayer[];
  confidence: number;
}

export function OCRImporter() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detectedData, setDetectedData] = useState<DetectedScoreboard | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addMatch } = useAppStore();

  // Load Tesseract dynamically
  const loadTesseract = async () => {
    const { createWorker } = await import('tesseract.js');
    return createWorker('eng');
  };

  const processImage = useCallback(async (imageFile: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target?.result as string);
      reader.readAsDataURL(imageFile);

      // Load Tesseract and process
      const worker = await loadTesseract();
      setProcessingProgress(30);

      const result = await worker.recognize(imageFile);
      setProcessingProgress(70);

      await worker.terminate();

      // Parse detected text
      const parsed = parseScoreboardText((result as any).data.text);
      setDetectedData(parsed);
      setProcessingProgress(100);

      if (parsed.confidence > 50) {
        setShowEditDialog(true);
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Error procesando la imagen. Intenta con otra captura más clara.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const parseScoreboardText = (text: string): DetectedScoreboard => {
    const lines = text.split('\n').filter((l) => l.trim());
    const players: DetectedPlayer[] = [];
    let map: string | undefined;
    let scoreUs: number | undefined;
    let scoreThem: number | undefined;

    // Try to detect map
    for (const mapName of VALORANT_MAPS) {
      if (text.toLowerCase().includes(mapName.toLowerCase())) {
        map = mapName;
        break;
      }
    }

    // Try to detect score (patterns like "13 - 11" or "13:11")
    const scorePattern = /(\d+)\s*[-:]\s*(\d+)/;
    for (const line of lines) {
      const match = line.match(scorePattern);
      if (match) {
        scoreUs = parseInt(match[1]);
        scoreThem = parseInt(match[2]);
        break;
      }
    }

    // Try to detect player stats
    // Look for patterns like "PlayerName Agent 20 10 5 250"
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      
      // Check if line looks like player stats (has numbers)
      const numbers = parts.filter((p) => /^\d+$/.test(p)).map(Number);
      
      if (numbers.length >= 3 && parts.length >= 4) {
        const name = parts[0];
        const agent = detectAgent(parts[1]);
        
        players.push({
          name,
          agent,
          k: numbers[0],
          d: numbers[1],
          a: numbers[2],
          acs: numbers[3] || numbers[2],
          confidence: 70,
        });
      }
    }

    return {
      map,
      scoreUs,
      scoreThem,
      players,
      confidence: players.length >= 5 ? 75 : 40,
    };
  };

  const detectAgent = (text: string): string | undefined => {
    const agents = [
      'Jett', 'Raze', 'Reyna', 'Phoenix', 'Yoru', 'Neon', 'Iso', 'Waylay',
      'Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove',
      'Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko', 'Tejo',
      'Sage', 'Cypher', 'Killjoy', 'Chamber', 'Deadlock', 'Veto'
    ];
    
    const lowerText = text.toLowerCase();
    for (const agent of agents) {
      if (lowerText.includes(agent.toLowerCase())) {
        return agent;
      }
    }
    return undefined;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const saveMatch = (editedData: DetectedScoreboard) => {
    const ourPlayers = editedData.players.slice(0, 5);

    const match = {
      type: 'CUSTOM' as const,
      map: editedData.map || 'Unknown',
      date: new Date().toISOString().split('T')[0],
      atk: 0,
      def: 0,
      scoreUs: editedData.scoreUs || 0,
      scoreOpp: editedData.scoreThem || 0,
      otWin: 0,
      otLoss: 0,
      won: (editedData.scoreUs || 0) > (editedData.scoreThem || 0),
      pistolAtkWin: false,
      pistolDefWin: false,
      postWin: 0,
      postLoss: 0,
      retakeWin: 0,
      retakeLoss: 0,
      players: ourPlayers.map((p) => ({
        id: crypto.randomUUID(),
        name: p.name,
        agent: p.agent || 'Unknown',
        role: AGENT_ROLES[p.agent || ''] || 'Unknown',
        k: p.k || 0,
        d: p.d || 0,
        a: p.a || 0,
        kast: 0,
        fk: 0,
        fd: 0,
        acs: p.acs || 0,
        plants: 0,
        defuses: 0,
      })),
    };

    addMatch(match as any);
    setShowEditDialog(false);
    setPreviewImage(null);
    setDetectedData(null);
    alert('Partido importado correctamente!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Scan className="w-7 h-7 text-[#ff4655]" />
            OCR Scoreboard Import
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Importa partidos automáticamente desde capturas de pantalla
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'glass-card rounded-xl p-8 text-center cursor-pointer transition-all',
          'hover:border-[#ff4655]/50 hover:bg-[#ff4655]/5',
          'border-2 border-dashed border-[#2a2a3e]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isProcessing ? (
          <div className="space-y-4">
            <RefreshCw className="w-12 h-12 text-[#ff4655] mx-auto animate-spin" />
            <p className="text-white font-medium">Procesando imagen...</p>
            <div className="w-64 h-2 bg-[#1a1a2e] rounded-full mx-auto overflow-hidden">
              <div
                className="h-full bg-[#ff4655] transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <p className="text-gray-500 text-sm">{processingProgress}% completado</p>
          </div>
        ) : (
          <>
            <Camera className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">
              Arrastra una captura o haz click para seleccionar
            </p>
            <p className="text-gray-500 text-sm">
              Soporta: PNG, JPG, JPEG. Captura el scoreboard completo para mejor precisión.
            </p>
          </>
        )}
      </div>

      {/* Preview */}
      {previewImage && !isProcessing && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#ff4655]" />
              Vista Previa
            </h3>
            <button
              onClick={() => {
                setPreviewImage(null);
                setDetectedData(null);
              }}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
          <img
            src={previewImage}
            alt="Scoreboard preview"
            className="max-h-64 mx-auto rounded-lg"
          />
        </div>
      )}

      {/* Detection Results */}
      {detectedData && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#ff4655]" />
              Datos Detectados
            </h3>
            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              detectedData.confidence >= 70 
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            )}>
              Confianza: {detectedData.confidence}%
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-[#0f0f1e] rounded-lg p-3">
              <p className="text-gray-500 text-xs">Mapa</p>
              <p className="text-white font-medium">{detectedData.map || 'No detectado'}</p>
            </div>
            <div className="bg-[#0f0f1e] rounded-lg p-3">
              <p className="text-gray-500 text-xs">Score</p>
              <p className="text-white font-medium">
                {detectedData.scoreUs ?? '?'}-{detectedData.scoreThem ?? '?'}
              </p>
            </div>
            <div className="bg-[#0f0f1e] rounded-lg p-3">
              <p className="text-gray-500 text-xs">Jugadores</p>
              <p className="text-white font-medium">{detectedData.players.length}</p>
            </div>
          </div>

          <Button
            onClick={() => setShowEditDialog(true)}
            className="w-full bg-[#ff4655] hover:bg-[#ff6b7a]"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Revisar y Editar
          </Button>
        </div>
      )}

      {/* Tips */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#ff4655]" />
          Consejos para mejor detección
        </h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Captura el scoreboard completo, no solo una parte</li>
          <li>• Asegúrate de que el texto sea legible (evita blur)</li>
          <li>• El scoreboard debe estar en inglés para mejor precisión</li>
          <li>• Evita reflejos o sombras sobre el texto</li>
        </ul>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#0f0f1e] border-[#1a1a2e] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar Datos Detectados</DialogTitle>
          </DialogHeader>

          {detectedData && (
            <div className="space-y-4">
              {/* Match Info */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Mapa</label>
                  <select
                    value={detectedData.map || ''}
                    onChange={(e) => setDetectedData({ ...detectedData, map: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white"
                  >
                    {VALORANT_MAPS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Nuestro Score</label>
                  <input
                    type="number"
                    value={detectedData.scoreUs || ''}
                    onChange={(e) => setDetectedData({ ...detectedData, scoreUs: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Score Rival</label>
                  <input
                    type="number"
                    value={detectedData.scoreThem || ''}
                    onChange={(e) => setDetectedData({ ...detectedData, scoreThem: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Players */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Jugadores Detectados</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {detectedData.players.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#1a1a2e] rounded-lg p-2">
                      <span className="text-gray-500 w-6">{idx + 1}</span>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => {
                          const newPlayers = [...detectedData.players];
                          newPlayers[idx] = { ...player, name: e.target.value };
                          setDetectedData({ ...detectedData, players: newPlayers });
                        }}
                        className="flex-1 px-2 py-1 bg-[#0f0f1e] rounded text-white text-sm"
                      />
                      <input
                        type="text"
                        value={player.agent || ''}
                        placeholder="Agente"
                        onChange={(e) => {
                          const newPlayers = [...detectedData.players];
                          newPlayers[idx] = { ...player, agent: e.target.value };
                          setDetectedData({ ...detectedData, players: newPlayers });
                        }}
                        className="w-24 px-2 py-1 bg-[#0f0f1e] rounded text-white text-sm"
                      />
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={player.k || ''}
                          placeholder="K"
                          onChange={(e) => {
                            const newPlayers = [...detectedData.players];
                            newPlayers[idx] = { ...player, k: parseInt(e.target.value) || 0 };
                            setDetectedData({ ...detectedData, players: newPlayers });
                          }}
                          className="w-12 px-2 py-1 bg-[#0f0f1e] rounded text-white text-sm text-center"
                        />
                        <input
                          type="number"
                          value={player.d || ''}
                          placeholder="D"
                          onChange={(e) => {
                            const newPlayers = [...detectedData.players];
                            newPlayers[idx] = { ...player, d: parseInt(e.target.value) || 0 };
                            setDetectedData({ ...detectedData, players: newPlayers });
                          }}
                          className="w-12 px-2 py-1 bg-[#0f0f1e] rounded text-white text-sm text-center"
                        />
                        <input
                          type="number"
                          value={player.acs || ''}
                          placeholder="ACS"
                          onChange={(e) => {
                            const newPlayers = [...detectedData.players];
                            newPlayers[idx] = { ...player, acs: parseInt(e.target.value) || 0 };
                            setDetectedData({ ...detectedData, players: newPlayers });
                          }}
                          className="w-16 px-2 py-1 bg-[#0f0f1e] rounded text-white text-sm text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowEditDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={() => saveMatch(detectedData)}
                  className="flex-1 bg-[#ff4655] hover:bg-[#ff6b7a]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Partido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  Camera, 
  Loader2, 
  Check, 
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { VALORANT_AGENTS, type MatchType } from '@/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Dynamic import for Tesseract to avoid SSR issues
let Tesseract: any = null;

interface ParsedPlayer {
  name: string;
  agent?: string;
  acs: number;
  k: number;
  d: number;
  a: number;
  econScore: number;
  fk: number;
  plants: number;
  defuses: number;
  team: 'us' | 'opponent';
}

interface ParsedMatch {
  scoreUs: number;
  scoreOpp: number;
  map?: string;
  type?: MatchType;
  date?: string;
  won: boolean;
  players: ParsedPlayer[];
}

interface ScreenshotImportProps {
  onImport: (match: Partial<ParsedMatch>) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function ScreenshotImport({ onImport, onClose, isOpen }: ScreenshotImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Tesseract dynamically
  const loadTesseract = async () => {
    if (!Tesseract) {
      const module = await import('tesseract.js');
      Tesseract = module.default;
    }
    return Tesseract;
  };

  const detectAgent = (playerName: string): string | undefined => {
    const lowerName = playerName.toLowerCase();
    for (const agent of VALORANT_AGENTS) {
      if (lowerName.includes(agent.toLowerCase())) {
        return agent;
      }
    }
    return undefined;
  };

  const parseScoreboardText = (text: string): ParsedMatch | null => {
    // Try to find score
    let scoreUs = 0;
    let scoreOpp = 0;
    let won = false;
    
    // Look for score patterns like "13 VICTORIA 7" or "13 7"
    const scoreMatch = text.match(/(\d+)\s*(?:VICTORIA|VICTORY|WIN|DERROTA|DEFEAT|LOSS)?\s*(\d+)/i);
    if (scoreMatch) {
      scoreUs = parseInt(scoreMatch[1]);
      scoreOpp = parseInt(scoreMatch[2]);
      won = text.toLowerCase().includes('victoria') || text.toLowerCase().includes('victory');
    }

    // Try to find map
    let map: string | undefined;
    const mapKeywords = ['BIND', 'HAVEN', 'SPLIT', 'ASCENT', 'BREEZE', 'ICEBOX', 'PEARL', 'LOTUS', 'SUNSET', 'ABYSS', 'FRACTURE'];
    for (const mapName of mapKeywords) {
      if (text.toUpperCase().includes(mapName)) {
        map = mapName.charAt(0) + mapName.slice(1).toLowerCase();
        break;
      }
    }

    // Try to find game type
    let type: MatchType | undefined;
    if (text.toUpperCase().includes('PREMIER')) type = 'PREMIER';
    else if (text.toUpperCase().includes('COMPETITIVO') || text.toUpperCase().includes('COMPETITIVE')) type = 'OFICIAL';
    else if (text.toUpperCase().includes('NORMAL') || text.toUpperCase().includes('UNRATED')) type = 'SCRIM';

    // Parse players
    const players: ParsedPlayer[] = [];
    
    // Look for player lines - they typically have patterns like:
    // "VEX|Toñin 339 27/11/0 68 4 0 2"
    // or "VEX Toñin 339 27 11 0 68 4 0 2"
    
    const playerRegex = /([A-Z][a-zA-Z0-9\s\|._-]+?)\s+(\d{2,3})\s+(\d{1,2})\s*[/\s]\s*(\d{1,2})\s*[/\s]\s*(\d{1,2})\s+(\d{2,3})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})/g;
    
    let match;
    while ((match = playerRegex.exec(text)) !== null) {
      const name = match[1].trim();
      const acs = parseInt(match[2]) || 0;
      const k = parseInt(match[3]) || 0;
      const d = parseInt(match[4]) || 0;
      const a = parseInt(match[5]) || 0;
      const econScore = parseInt(match[6]) || 0;
      const fk = parseInt(match[7]) || 0;
      const plants = parseInt(match[8]) || 0;
      const defuses = parseInt(match[9]) || 0;

      // Detect team based on context or patterns
      // In Valorant scoreboard, your team is usually on top (green) or we can infer from the pattern
      const team: 'us' | 'opponent' = players.length < 5 ? 'us' : 'opponent';

      players.push({
        name,
        agent: detectAgent(name),
        acs,
        k,
        d,
        a,
        econScore,
        fk,
        plants,
        defuses,
        team
      });
    }

    // Alternative parsing for different formats
    if (players.length === 0) {
      // Try simpler pattern: Name ACS K D A
      const simpleRegex = /([A-Z][a-zA-Z0-9\s\|._-]+?)\s+(\d{2,3})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})/g;
      while ((match = simpleRegex.exec(text)) !== null) {
        const name = match[1].trim();
        const acs = parseInt(match[2]) || 0;
        const k = parseInt(match[3]) || 0;
        const d = parseInt(match[4]) || 0;
        const a = parseInt(match[5]) || 0;

        const team: 'us' | 'opponent' = players.length < 5 ? 'us' : 'opponent';

        players.push({
          name,
          agent: detectAgent(name),
          acs,
          k,
          d,
          a,
          econScore: 0,
          fk: 0,
          plants: 0,
          defuses: 0,
          team
        });
      }
    }

    if (players.length === 0 && scoreUs === 0 && scoreOpp === 0) {
      return null;
    }

    return {
      scoreUs,
      scoreOpp,
      map,
      type,
      date: new Date().toISOString().split('T')[0],
      won,
      players
    };
  };

  const processImage = async (imageFile: File) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const tesseract = await loadTesseract();
      
      // Create worker with Spanish and English language support
      const worker = await tesseract.createWorker('spa+eng');
      
      // Set up progress tracking
      worker.setProgress((progress: any) => {
        setProgress(Math.round((progress.progress || 0) * 100));
      });

      const result = await worker.recognize(imageFile);
      await worker.terminate();

      const text = result.data.text;
      console.log('OCR Result:', text);

      const parsed = parseScoreboardText(text);
      
      if (parsed && (parsed.players.length > 0 || parsed.scoreUs > 0 || parsed.scoreOpp > 0)) {
        setParsedData(parsed);
      } else {
        setError('No se pudieron extraer datos del scoreboard. Intenta con una imagen más clara o recorta solo la tabla de puntuaciones.');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Error al procesar la imagen. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process with OCR
    await processImage(file);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      await processImage(file);
    }
  }, []);

  const handleConfirm = () => {
    if (parsedData) {
      onImport(parsedData);
      resetState();
      onClose();
    }
  };

  const resetState = () => {
    setPreviewImage(null);
    setParsedData(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    resetState();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto"
        style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 15% 20%)' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-red-400" />
            Importar desde Captura de Pantalla
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {!previewImage && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-red-400/50 hover:bg-red-500/5 transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Arrastra una imagen aquí</p>
              <p className="text-sm text-muted-foreground mb-4">o haz clic para seleccionar</p>
              <p className="text-xs text-muted-foreground">
                Soporta: JPG, PNG, WEBP
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="glass-card p-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-red-400" />
              <p className="text-lg font-medium mb-2">Procesando imagen...</p>
              <p className="text-sm text-muted-foreground mb-4">
                Extrayendo datos del scoreboard con OCR
              </p>
              <div className="w-64 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
            </div>
          )}

          {error && (
            <div className="glass-card p-6 border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-400 mb-1">Error</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
              <Button onClick={handleRetry} variant="outline" className="mt-4 w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Intentar de nuevo
              </Button>
            </div>
          )}

          {previewImage && parsedData && (
            <div className="space-y-4">
              {/* Preview Image */}
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full max-h-48 object-contain rounded-lg bg-black/30"
                />
                <button
                  onClick={handleRetry}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Parsed Data Preview */}
              <div className="glass-card p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Datos extraídos
                </h4>

                {/* Match Info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-xl font-mono font-bold">
                      <span className={parsedData.won ? 'text-green-400' : 'text-red-400'}>
                        {parsedData.scoreUs}
                      </span>
                      <span className="text-muted-foreground mx-2">-</span>
                      <span className={!parsedData.won ? 'text-green-400' : 'text-red-400'}>
                        {parsedData.scoreOpp}
                      </span>
                    </p>
                  </div>
                  {parsedData.map && (
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground">Mapa</p>
                      <p className="text-lg font-medium">{parsedData.map}</p>
                    </div>
                  )}
                  {parsedData.type && (
                    <div className="p-3 rounded-lg bg-white/5">
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="text-lg font-medium">{parsedData.type}</p>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-muted-foreground">Resultado</p>
                    <p className={parsedData.won ? 'text-green-400' : 'text-red-400'}>
                      {parsedData.won ? 'Victoria' : 'Derrota'}
                    </p>
                  </div>
                </div>

                {/* Players */}
                {parsedData.players.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Jugadores detectados: {parsedData.players.length}
                    </p>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {parsedData.players.map((player, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "flex items-center justify-between p-2 rounded text-sm",
                            player.team === 'us' ? "bg-green-500/10" : "bg-red-500/10"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              player.team === 'us' ? "bg-green-400" : "bg-red-400"
                            )} />
                            <span className="font-medium">{player.name}</span>
                            {player.agent && (
                              <span className="text-xs text-muted-foreground">({player.agent})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-mono">
                            <span className="text-yellow-400">ACS {player.acs}</span>
                            <span>{player.k}/{player.d}/{player.a}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleRetry} variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
                <Button onClick={handleConfirm} className="btn-primary flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Importación
                </Button>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="glass-card p-4">
            <p className="text-sm font-medium mb-2">Consejos para mejores resultados:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Usa capturas de pantalla en alta resolución</li>
              <li>• Asegúrate de que el scoreboard sea legible</li>
              <li>• Recorta la imagen para mostrar solo la tabla de puntuaciones</li>
              <li>• Evita reflejos o sombras en la pantalla</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

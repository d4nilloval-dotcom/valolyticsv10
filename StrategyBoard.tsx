import { useState, useRef, useEffect } from 'react';
import { 
  Save, Trash2, MousePointer2, Pencil, ArrowRight, Download, Upload, Layers,
  Target, Flame, Wind, Zap, Shield, Eye, Crosshair, X, Undo,
  Minus, Type
} from 'lucide-react';
import { VALORANT_MAPS, type AgentRole } from '@/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AGENTS_BY_ROLE: Record<AgentRole, string[]> = {
  'Duelist': ['Jett', 'Raze', 'Reyna', 'Phoenix', 'Yoru', 'Neon', 'Iso', 'Waylay'],
  'Controller': ['Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove'],
  'Initiator': ['Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko', 'Tejo'],
  'Sentinel': ['Sage', 'Cypher', 'Killjoy', 'Chamber', 'Deadlock', 'Veto'],
  'Unknown': []
};

const ROLE_COLORS: Record<AgentRole, string> = {
  'Duelist': '#ef4444', 'Controller': '#a855f7', 'Initiator': '#06b6d4', 'Sentinel': '#22c55e', 'Unknown': '#6b7280'
};

const MAP_IMAGES: Record<string, string> = {
  'Ascent': '/maps/ascent.png', 'Bind': '/maps/bind.png', 'Haven': '/maps/haven.png',
  'Split': '/maps/split.png', 'Breeze': '/maps/breeze.png', 'Icebox': '/maps/icebox.png',
  'Pearl': '/maps/pearl.png', 'Lotus': '/maps/lotus.png', 'Sunset': '/maps/sunset.png',
  'Abyss': '/maps/abyss.png', 'Fracture': '/maps/fracture.png',
};

interface StrategyElement {
  id: string; type: 'agent' | 'ability' | 'text' | 'spawn'; x: number; y: number;
  data?: string; color?: string; label?: string; abilityName?: string;
}

interface DrawPoint { x: number; y: number }
interface DrawElement {
  id: string; type: 'freehand' | 'line' | 'arrow'; points: DrawPoint[];
  color: string; width: number;
}

interface Strategy {
  id: string; name: string; map: string; side: 'ATK' | 'DEF';
  site: 'A' | 'B' | 'C' | 'MID'; elements: StrategyElement[]; drawings: DrawElement[];
  createdAt: number;
}

export function StrategyBoard() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedMap, setSelectedMap] = useState('Ascent');
  const [selectedSide, setSelectedSide] = useState<'ATK' | 'DEF'>('ATK');
  const [selectedSite, setSelectedSite] = useState<'A' | 'B' | 'C' | 'MID'>('A');
  const [tool, setTool] = useState<'select' | 'agent' | 'draw' | 'line' | 'arrow' | 'text' | 'erase'>('select');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [elements, setElements] = useState<StrategyElement[]>([]);
  const [drawings, setDrawings] = useState<DrawElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDraw, setCurrentDraw] = useState<DrawElement | null>(null);
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawWidth, setDrawWidth] = useState(3);
  const [savedStrategies, setSavedStrategies] = useState<Strategy[]>([]);
  const [strategyName, setStrategyName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showAbilityPicker, setShowAbilityPicker] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('valoanalytics_strategies');
    if (saved) setSavedStrategies(JSON.parse(saved));
  }, []);

  const getAgentRole = (agent: string): AgentRole => {
    for (const [role, agents] of Object.entries(AGENTS_BY_ROLE)) {
      if (agents.includes(agent)) return role as AgentRole;
    }
    return 'Unknown';
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || tool === 'draw' || tool === 'line' || tool === 'arrow' || isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (tool === 'agent' && selectedAgent) {
      const role = getAgentRole(selectedAgent);
      setElements(prev => [...prev, {
        id: crypto.randomUUID(), type: 'agent', x, y,
        data: selectedAgent, color: ROLE_COLORS[role], label: selectedAgent
      }]);
      setShowAbilityPicker(true);
    } else if (tool === 'text') {
      const text = prompt('Texto:');
      if (text) setElements(prev => [...prev, { id: crypto.randomUUID(), type: 'text', x, y, label: text, color: '#fff' }]);
    } else if (tool === 'erase') {
      const clickedElement = elements.find(el => {
        const dx = Math.abs(el.x - x);
        const dy = Math.abs(el.y - y);
        return dx < 3 && dy < 3;
      });
      if (clickedElement) deleteElement(clickedElement.id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current || (tool !== 'draw' && tool !== 'line' && tool !== 'arrow')) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setIsDrawing(true);
    setCurrentDraw({
      id: crypto.randomUUID(),
      type: tool === 'draw' ? 'freehand' : tool === 'arrow' ? 'arrow' : 'line',
      points: [{ x, y }], color: drawColor, width: drawWidth
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentDraw || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (currentDraw.type === 'freehand') {
      setCurrentDraw({ ...currentDraw, points: [...currentDraw.points, { x, y }] });
    } else {
      setCurrentDraw({ ...currentDraw, points: [currentDraw.points[0], { x, y }] });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDraw && currentDraw.points.length > 1) {
      setDrawings(prev => [...prev, currentDraw]);
    }
    setIsDrawing(false);
    setCurrentDraw(null);
  };

  const handleElementDrag = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    if (tool !== 'select') return;
    setSelectedElement(elementId);
    
    const handleMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      setElements(prev => prev.map(el => el.id === elementId ? { ...el, x, y } : el));
    };
    
    const handleUp = () => { setSelectedElement(null); window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const deleteElement = (id: string) => setElements(prev => prev.filter(el => el.id !== id));
  const undoLast = () => { if (drawings.length > 0) setDrawings(prev => prev.slice(0, -1)); };
  const clearCanvas = () => { if (confirm('¿Borrar todo?')) { setElements([]); setDrawings([]); } };

  const saveStrategy = () => {
    if (!strategyName.trim()) return;
    const strategy: Strategy = {
      id: crypto.randomUUID(), name: strategyName, map: selectedMap,
      side: selectedSide, site: selectedSite, elements, drawings, createdAt: Date.now()
    };
    const updated = [...savedStrategies, strategy];
    setSavedStrategies(updated);
    localStorage.setItem('valoanalytics_strategies', JSON.stringify(updated));
    setShowSaveDialog(false);
    setStrategyName('');
  };

  const loadStrategy = (strategy: Strategy) => {
    setSelectedMap(strategy.map);
    setSelectedSide(strategy.side);
    setSelectedSite(strategy.site);
    setElements(strategy.elements);
    setDrawings(strategy.drawings);
    setShowLoadDialog(false);
  };

  const deleteStrategy = (id: string) => {
    const updated = savedStrategies.filter(s => s.id !== id);
    setSavedStrategies(updated);
    localStorage.setItem('valoanalytics_strategies', JSON.stringify(updated));
  };

  const exportStrategy = () => {
    const strategy: Strategy = {
      id: crypto.randomUUID(), name: strategyName || 'Estrategia', map: selectedMap,
      side: selectedSide, site: selectedSite, elements, drawings, createdAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(strategy, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy_${strategy.map}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importStrategy = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try { loadStrategy(JSON.parse(event.target?.result as string)); } 
      catch { alert('Error al cargar'); }
    };
    reader.readAsText(file);
  };

  const addAbilityToAgent = (abilityType: string) => {
    if (!selectedAgent || elements.length === 0) return;
    const lastAgent = elements[elements.length - 1];
    if (lastAgent.type === 'agent') {
      const colors: Record<string, string> = {
        smoke: '#6b7280', flash: '#eab308', molly: '#f97316', recon: '#3b82f6',
        wall: '#22c55e', trap: '#ef4444', dart: '#a855f7', ult: '#dc2626'
      };
      setElements(prev => [...prev, {
        id: crypto.randomUUID(), type: 'ability', x: lastAgent.x + 3, y: lastAgent.y + 3,
        data: abilityType, color: colors[abilityType] || '#fff', label: abilityType
      }]);
    }
    setShowAbilityPicker(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select value={selectedMap} onChange={(e) => setSelectedMap(e.target.value)} className="input-pro">
            {VALORANT_MAPS.map(map => <option key={map} value={map}>{map}</option>)}
          </select>
          <select value={selectedSide} onChange={(e) => setSelectedSide(e.target.value as 'ATK' | 'DEF')} className="input-pro">
            <option value="ATK">Ataque</option><option value="DEF">Defensa</option>
          </select>
          <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value as 'A' | 'B' | 'C' | 'MID')} className="input-pro">
            <option value="A">Site A</option><option value="B">Site B</option><option value="C">Site C</option><option value="MID">Mid</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowLoadDialog(true)} variant="outline" size="sm"><Layers className="w-4 h-4 mr-2" />Cargar</Button>
          <Button onClick={() => setShowSaveDialog(true)} variant="outline" size="sm"><Save className="w-4 h-4 mr-2" />Guardar</Button>
          <Button onClick={exportStrategy} variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Exportar</Button>
          <label className="btn-secondary cursor-pointer text-sm"><Upload className="w-4 h-4 mr-2" />Importar<input type="file" accept=".json" onChange={importStrategy} className="hidden" /></label>
          <Button onClick={undoLast} variant="outline" size="sm"><Undo className="w-4 h-4" /></Button>
          <Button onClick={clearCanvas} variant="outline" size="sm" className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 glass-card">
        {[
          { id: 'select', icon: MousePointer2, label: 'Seleccionar' },
          { id: 'draw', icon: Pencil, label: 'Dibujar' },
          { id: 'line', icon: Minus, label: 'Línea' },
          { id: 'arrow', icon: ArrowRight, label: 'Flecha' },
          { id: 'agent', icon: Target, label: 'Agente' },
          { id: 'text', icon: Type, label: 'Texto' },
          { id: 'erase', icon: X, label: 'Borrar' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTool(id as any)} title={label}
            className={cn("p-2 rounded-lg transition-colors flex items-center gap-2",
              tool === id ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50" : "hover:bg-white/10"
            )}>
            <Icon className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">{label}</span>
          </button>
        ))}
        <div className="w-px h-8 bg-white/10 mx-1" />
        <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
        <input type="range" min="1" max="8" value={drawWidth} onChange={(e) => setDrawWidth(parseInt(e.target.value))} className="w-20" />
      </div>

      {/* Agent Selection */}
      {tool === 'agent' && (
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-3">Selecciona un agente:</p>
          <div className="space-y-3">
            {(Object.keys(AGENTS_BY_ROLE) as AgentRole[]).filter(r => r !== 'Unknown').map(role => (
              <div key={role}>
                <p className="text-xs text-muted-foreground mb-2">{role}s</p>
                <div className="flex flex-wrap gap-2">
                  {AGENTS_BY_ROLE[role].map(agent => (
                    <button key={agent} onClick={() => setSelectedAgent(agent)}
                      className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        selectedAgent === agent ? "ring-2 ring-offset-1" : "hover:bg-white/10"
                      )}
                      style={{ background: selectedAgent === agent ? `${ROLE_COLORS[role]}40` : 'hsl(220 15% 15%)', color: ROLE_COLORS[role] }}>
                      {agent}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ability Picker */}
      {showAbilityPicker && (
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-3">Añadir habilidad para {selectedAgent}:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'smoke', name: 'Smoke', icon: Wind, color: '#6b7280' },
              { id: 'flash', name: 'Flash', icon: Zap, color: '#eab308' },
              { id: 'molly', name: 'Molly', icon: Flame, color: '#f97316' },
              { id: 'recon', name: 'Recon', icon: Eye, color: '#3b82f6' },
              { id: 'wall', name: 'Wall', icon: Shield, color: '#22c55e' },
              { id: 'trap', name: 'Trap', icon: Target, color: '#ef4444' },
              { id: 'ult', name: 'Ultimate', icon: Crosshair, color: '#dc2626' },
            ].map(ability => {
              const Icon = ability.icon;
              return (
                <button key={ability.id} onClick={() => addAbilityToAgent(ability.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                  style={{ background: `${ability.color}30`, color: ability.color }}>
                  <Icon className="w-4 h-4" /><span className="text-sm">{ability.name}</span>
                </button>
              );
            })}
            <button onClick={() => setShowAbilityPicker(false)} className="px-3 py-2 rounded-lg hover:bg-white/10 text-muted-foreground">Omitir</button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div ref={canvasRef} className="relative w-full aspect-video bg-[#1a1f2e] rounded-xl overflow-hidden cursor-crosshair select-none"
        onClick={handleCanvasClick} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <img src={MAP_IMAGES[selectedMap]} alt={selectedMap} className="absolute inset-0 w-full h-full object-contain opacity-90" />
        
        {/* Map Label */}
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur text-sm font-medium">
          {selectedMap} - {selectedSide} - Site {selectedSite}
        </div>

        {/* SVG Drawings */}
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={drawColor} />
            </marker>
          </defs>
          {drawings.map(draw => (
            <polyline key={draw.id}
              points={draw.points.map(p => `${p.x}%,${p.y}%`).join(' ')}
              fill="none" stroke={draw.color} strokeWidth={draw.width}
              strokeLinecap="round" strokeLinejoin="round"
              markerEnd={draw.type === 'arrow' ? "url(#arrowhead)" : undefined}
            />
          ))}
          {currentDraw && (
            <polyline points={currentDraw.points.map(p => `${p.x}%,${p.y}%`).join(' ')}
              fill="none" stroke={currentDraw.color} strokeWidth={currentDraw.width}
              strokeLinecap="round" strokeLinejoin="round"
              markerEnd={currentDraw.type === 'arrow' ? "url(#arrowhead)" : undefined}
            />
          )}
        </svg>

        {/* Elements */}
        {elements.map(el => (
          <div key={el.id} className={cn("absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move",
            selectedElement === el.id && "ring-2 ring-white rounded-full")}
            style={{ left: `${el.x}%`, top: `${el.y}%` }}
            onMouseDown={(e) => handleElementDrag(e, el.id)}>
            {el.type === 'agent' && (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-lg"
                style={{ background: `${el.color}60`, borderColor: el.color, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {el.data?.slice(0, 2)}
              </div>
            )}
            {el.type === 'ability' && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: el.color }}>
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
            {el.type === 'text' && (
              <span className="px-2 py-1 rounded bg-black/80 text-white text-sm font-medium whitespace-nowrap shadow-lg">{el.label}</span>
            )}
            {el.type === 'spawn' && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                style={{ background: el.color }}>{el.label?.[0]}</div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="glass-card p-4">
        <p className="text-sm font-medium mb-2">Instrucciones:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <b>Dibujar</b>: Haz clic y arrastra para trazar líneas libres</li>
          <li>• <b>Línea/Flecha</b>: Haz clic y arrastra para crear líneas rectas o flechas</li>
          <li>• <b>Agente</b>: Selecciona un agente y haz clic en el mapa, luego añade habilidades</li>
          <li>• <b>Texto</b>: Haz clic en el mapa para añadir anotaciones</li>
          <li>• <b>Borrar</b>: Haz clic en un elemento para eliminarlo</li>
          <li>• <b>Seleccionar</b>: Arrastra elementos para moverlos</li>
        </ul>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 15% 20%)' }}>
          <DialogHeader><DialogTitle>Guardar Estrategia</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <input type="text" value={strategyName} onChange={(e) => setStrategyName(e.target.value)}
              className="input-pro w-full" placeholder="ej: Execute A - Bind" />
            <div className="flex gap-3">
              <Button onClick={() => setShowSaveDialog(false)} variant="outline" className="flex-1">Cancelar</Button>
              <Button onClick={saveStrategy} className="btn-primary flex-1" disabled={!strategyName.trim()}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-lg" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 15% 20%)' }}>
          <DialogHeader><DialogTitle>Cargar Estrategia</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-4 max-h-96 overflow-auto">
            {savedStrategies.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay estrategias guardadas</p>
            ) : savedStrategies.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <div><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.map} - {s.side} - Site {s.site}</p></div>
                <div className="flex gap-2">
                  <Button onClick={() => loadStrategy(s)} size="sm" variant="outline">Cargar</Button>
                  <Button onClick={() => deleteStrategy(s.id)} size="sm" variant="outline" className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

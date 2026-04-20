import { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BarChart3, 
  Map, 
  Target,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trophy,
  CalendarDays,
  Swords,
  Video,
  Eye,
  Bot,
  Shield,
  Flame,
  Brain,
  Scan,
  FileJson,
  Smartphone,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'matches', label: 'Partidos', icon: Calendar },
  { id: 'players', label: 'Jugadores', icon: Users },
  { id: 'player-stats', label: 'Estadísticas', icon: BarChart3 },
  { id: 'weekly', label: 'Semanal', icon: CalendarDays },
  { id: 'maps', label: 'Mapas', icon: Map },
  { id: 'strategies', label: 'Estrategias', icon: Target },
  { id: 'rivals', label: 'Rivales', icon: Swords },
  { id: 'draft', label: 'Draft Analyzer', icon: Shield },
  { id: 'vods', label: 'VODs', icon: Video },
  { id: 'vod-review', label: 'VOD Review', icon: MessageSquare },
  { id: 'heatmaps', label: 'Heatmaps', icon: Flame },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'spectator', label: 'Espectador', icon: Eye },
  { id: 'discord', label: 'Discord Bot', icon: Bot },
  { id: 'advanced', label: 'Advanced Pro', icon: Brain },
  { id: 'ocr', label: 'OCR Import', icon: Scan },
  { id: 'demo-parser', label: 'Demo Parser', icon: FileJson },
  { id: 'mobile', label: 'Mobile App', icon: Smartphone },
  { id: 'comparison', label: 'Comparación', icon: Target },
  { id: 'scouting', label: 'Scouting', icon: Trophy },
  { id: 'reports', label: 'Informes', icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r transition-all duration-300",
          collapsed ? 'w-20' : 'w-64'
        )}
        style={{ 
          borderColor: 'hsl(220 15% 15%)',
          background: 'linear-gradient(180deg, hsl(220 22% 8%) 0%, hsl(220 25% 6%) 100%)'
        }}
      >
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: 'hsl(220 15% 15%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ 
                background: 'linear-gradient(135deg, hsl(355 85% 58%) 0%, hsl(355 70% 45%) 100%)',
                boxShadow: '0 4px 15px hsl(355 85% 58% / 0.3)'
              }}
            >
              <span className="text-white font-bold text-lg">V</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg leading-tight">ValoAnalytics</h1>
                <p className="text-xs" style={{ color: 'hsl(215 15% 55%)' }}>Pro Edition</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === item.id 
                    ? 'text-white' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
                style={activeTab === item.id ? {
                  background: 'hsl(355 85% 58% / 0.1)',
                  border: '1px solid hsl(355 85% 58% / 0.3)'
                } : {}}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse button */}
        <div className="p-3 border-t" style={{ borderColor: 'hsl(220 15% 15%)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <header 
          className="h-16 border-b flex items-center justify-between px-6"
          style={{ 
            borderColor: 'hsl(220 15% 15%)',
            background: 'linear-gradient(90deg, hsl(220 22% 8%) 0%, hsl(220 25% 6%) 100%)'
          }}
        >
          <div>
            <h2 className="text-xl font-semibold">
              {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {activeTab === 'dashboard' && 'Visión general del rendimiento'}
              {activeTab === 'matches' && 'Gestión de partidos y resultados'}
              {activeTab === 'players' && 'Estadísticas por partido'}
              {activeTab === 'player-stats' && 'Análisis global de jugadores'}
              {activeTab === 'weekly' && 'Seguimiento semanal con alertas de tendencias'}
              {activeTab === 'maps' && 'Rendimiento por mapa'}
              {activeTab === 'strategies' && 'Creador de estrategias tipo Valoplant'}
              {activeTab === 'rivals' && 'Análisis de equipos rivales'}
              {activeTab === 'draft' && 'Analizador de pick/ban y composiciones'}
              {activeTab === 'vods' && 'Gestión de videos y timestamps'}
              {activeTab === 'heatmaps' && 'Visualización de zonas calientes'}
              {activeTab === 'calendar' && 'Calendario de partidos y eventos'}
              {activeTab === 'spectator' && 'Herramienta para coaches en vivo'}
              {activeTab === 'discord' && 'Integración con Discord Bot'}
              {activeTab === 'advanced' && 'Análisis avanzado: Win Probability, Synergies, Momentum'}
              {activeTab === 'ocr' && 'Importa partidos desde capturas de pantalla con OCR'}
              {activeTab === 'demo-parser' && 'Analiza archivos .dem de Valorant'}
              {activeTab === 'vod-review' && 'Sistema de revisión de VODs con comentarios'}
              {activeTab === 'mobile' && 'Versión móvil con notificaciones push'}
              {activeTab === 'comparison' && 'Comparación head-to-head'}
              {activeTab === 'scouting' && 'Notas y evaluación de jugadores'}
              {activeTab === 'reports' && 'Exportación de informes'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ 
                background: 'hsl(220 15% 15%)',
                border: '1px solid hsl(220 15% 22%)'
              }}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">localStorage</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

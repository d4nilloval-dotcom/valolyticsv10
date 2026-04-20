import { useState, useEffect } from 'react';
import {
  Smartphone,
  Bell,
  Calendar,
  Users,
  Trophy,
  Settings,
  ChevronRight,
  Clock,
  Map as MapIcon,
  Target,
  Zap,
  Download,
  Share2,
  Menu,
  X,
  Home,
  BarChart3,
  Swords,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';

interface QuickStat {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: typeof Trophy;
}

export function MobileApp() {
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'calendar' | 'more'>('home');
  const [isPWA, setIsPWA] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const { matches, players } = useAppStore();
  
  // Mock upcoming events for mobile view
  const upcomingEvents = [
    { id: '1', title: 'Scrim vs Team Liquid', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '20:00', type: 'SCRIM' },
    { id: '2', title: 'Entrenamiento', date: new Date(Date.now() + 172800000).toISOString().split('T')[0], time: '19:00', type: 'TRAINING' },
  ];

  // Check if running as PWA
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWA(isStandalone);

    // Show install prompt if not PWA
    if (!isStandalone && 'beforeinstallprompt' in window) {
      setShowInstallPrompt(true);
    }
  }, []);

  // Request notification permission
  const enableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        // Schedule notifications for upcoming events
        upcomingEvents.forEach((event) => {
          const eventDate = new Date(event.date);
          const now = new Date();
          const diff = eventDate.getTime() - now.getTime();
          
          // Notify 1 hour before
          if (diff > 3600000) {
            setTimeout(() => {
              new Notification('Valorant Analytics', {
                body: `Próximo partido: ${event.title} en 1 hora`,
                icon: '/icon-192x192.png',
              });
            }, diff - 3600000);
          }
        });
      }
    }
  };

  // Convert matches object to array
  const matchesArray = Object.values(matches || {});
  const playersArray = Object.values(players || {});

  // Quick stats
  const quickStats: QuickStat[] = [
    {
      label: 'Win Rate',
      value: `${matchesArray.length > 0 ? Math.round((matchesArray.filter((m: any) => m.won).length / matchesArray.length) * 100) : 0}%`,
      trend: 'up',
      icon: Trophy,
    },
    {
      label: 'Partidos',
      value: `${matchesArray.length}`,
      icon: Target,
    },
    {
      label: 'Jugadores',
      value: `${playersArray.length}`,
      icon: Users,
    },
  ];

  const renderHome = () => (
    <div className="space-y-4 p-4">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#ff4655] to-[#ff6b7a] rounded-2xl p-5 text-white">
        <h2 className="text-2xl font-bold">¡Hola!</h2>
        <p className="text-white/80 text-sm mt-1">
          {isPWA ? 'App instalada correctamente' : 'Instala la app para notificaciones'}
        </p>
        {!isPWA && (
          <Button
            onClick={() => setShowInstallPrompt(true)}
            className="mt-3 bg-white text-[#ff4655] hover:bg-white/90"
            size="sm"
          >
            <Download className="w-4 h-4 mr-1" />
            Instalar App
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {quickStats.map((stat, idx) => (
          <div key={idx} className="glass-card rounded-xl p-3 text-center">
            <stat.icon className="w-5 h-5 text-[#ff4655] mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-gray-500 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ff4655]" />
            Próximos Eventos
          </h3>
          <button className="text-[#ff4655] text-sm">Ver todos</button>
        </div>
        
        {upcomingEvents.length === 0 ? (
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-gray-500 text-sm">No hay eventos programados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff4655]/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#ff4655]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{event.title}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(event.date).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                    {event.time && ` · ${event.time}`}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-white font-semibold mb-3">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="glass-card rounded-xl p-4 text-left hover:bg-[#1a1a2e] transition-colors">
            <Target className="w-6 h-6 text-[#ff4655] mb-2" />
            <p className="text-white font-medium">Nuevo Partido</p>
            <p className="text-gray-500 text-xs">Añadir resultado</p>
          </button>
          <button className="glass-card rounded-xl p-4 text-left hover:bg-[#1a1a2e] transition-colors">
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-white font-medium">Jugadores</p>
            <p className="text-gray-500 text-xs">Ver stats</p>
          </button>
          <button className="glass-card rounded-xl p-4 text-left hover:bg-[#1a1a2e] transition-colors">
            <MapIcon className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-white font-medium">Mapas</p>
            <p className="text-gray-500 text-xs">Análisis por mapa</p>
          </button>
          <button className="glass-card rounded-xl p-4 text-left hover:bg-[#1a1a2e] transition-colors">
            <Swords className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-white font-medium">Rivales</p>
            <p className="text-gray-500 text-xs">Scouting</p>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {!notificationsEnabled && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-400" />
            <div className="flex-1">
              <p className="text-white font-medium">Activar Notificaciones</p>
              <p className="text-gray-500 text-sm">Recibe alertas de partidos</p>
            </div>
            <Button onClick={enableNotifications} size="sm" className="bg-blue-500 hover:bg-blue-600">
              Activar
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderStats = () => (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold text-white">Estadísticas</h2>
      
      {/* Win Rate Chart Placeholder */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-white font-medium mb-3">Win Rate por Mapa</h3>
        <div className="space-y-2">
          {['Ascent', 'Bind', 'Haven', 'Split'].map((map) => {
            const mapMatches = matchesArray.filter((m: any) => m.map === map);
            const wins = mapMatches.filter((m: any) => m.won).length;
            const winRate = mapMatches.length > 0 ? (wins / mapMatches.length) * 100 : 0;
            
            return (
              <div key={map} className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-16">{map}</span>
                <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ff4655] rounded-full"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
                <span className="text-white text-sm w-10 text-right">{winRate.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Matches */}
      <div>
        <h3 className="text-white font-medium mb-3">Partidos Recientes</h3>
        <div className="space-y-2">
          {matchesArray.slice(0, 5).map((match: any) => (
            <div key={match.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                match.won ? 'bg-green-500/20' : 'bg-red-500/20'
              )}>
                <span className={match.won ? 'text-green-400' : 'text-red-400'}>
                  {match.won ? 'W' : 'L'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">{match.map}</p>
                <p className="text-gray-500 text-xs">{match.date}</p>
              </div>
              <span className="text-white font-medium">
                {match.scoreUs}-{match.scoreOpp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold text-white">Calendario</h2>
      
      {/* Calendar Grid */}
      <div className="glass-card rounded-xl p-4">
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d) => (
            <span key={d} className="text-gray-500 text-xs">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 31 }, (_, i) => (
            <button
              key={i}
              className={cn(
                'aspect-square rounded-lg text-sm flex items-center justify-center',
                i === 14 ? 'bg-[#ff4655] text-white' : 'hover:bg-[#1a1a2e] text-gray-400'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div>
        <h3 className="text-white font-medium mb-3">Eventos del Mes</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay eventos</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="glass-card rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    event.type === 'MATCH' ? 'bg-red-500' :
                    event.type === 'SCRIM' ? 'bg-blue-500' :
                    'bg-green-500'
                  )} />
                  <span className="text-white font-medium">{event.title}</span>
                </div>
                <p className="text-gray-500 text-sm ml-4">{event.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMore = () => (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold text-white">Más Opciones</h2>
      
      <div className="space-y-2">
        <button className="w-full glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-[#1a1a2e] transition-colors">
          <Settings className="w-5 h-5 text-gray-400" />
          <span className="text-white">Configuración</span>
          <ChevronRight className="w-5 h-5 text-gray-500 ml-auto" />
        </button>
        
        <button className="w-full glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-[#1a1a2e] transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="text-white">Notificaciones</span>
          <span className={cn(
            'ml-auto text-xs px-2 py-1 rounded-full',
            notificationsEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          )}>
            {notificationsEnabled ? 'On' : 'Off'}
          </span>
        </button>
        
        <button className="w-full glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-[#1a1a2e] transition-colors">
          <Share2 className="w-5 h-5 text-gray-400" />
          <span className="text-white">Compartir App</span>
          <ChevronRight className="w-5 h-5 text-gray-500 ml-auto" />
        </button>
        
        <button className="w-full glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-[#1a1a2e] transition-colors">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="text-white">Versión Pro</span>
          <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
            Activo
          </span>
        </button>
      </div>

      {/* App Info */}
      <div className="glass-card rounded-xl p-4 text-center">
        <p className="text-gray-500 text-sm">Valorant Analytics Pro</p>
        <p className="text-gray-600 text-xs">v2.0.0</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-[#1a1a2e] px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">ValoAnalytics</h1>
          <div className="flex items-center gap-2">
            {notificationsEnabled && <Bell className="w-5 h-5 text-[#ff4655]" />}
            <div className="w-8 h-8 bg-[#ff4655] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-4">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'more' && renderMore()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/90 backdrop-blur-lg border-t border-[#1a1a2e] px-4 py-2">
        <div className="flex items-center justify-around">
          {[
            { id: 'home', label: 'Inicio', icon: Home },
            { id: 'stats', label: 'Stats', icon: BarChart3 },
            { id: 'calendar', label: 'Calendario', icon: Calendar },
            { id: 'more', label: 'Más', icon: Menu },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                activeTab === id ? 'text-[#ff4655]' : 'text-gray-500'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50 p-4">
          <div className="w-full bg-[#1a1a2e] rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-[#ff4655] rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold">Instalar ValoAnalytics</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Añade la app a tu pantalla de inicio para acceso rápido y notificaciones.
                </p>
              </div>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => setShowInstallPrompt(false)}
                variant="outline"
                className="flex-1"
              >
                Ahora no
              </Button>
              <Button
                onClick={() => {
                  // Trigger PWA install
                  setShowInstallPrompt(false);
                }}
                className="flex-1 bg-[#ff4655] hover:bg-[#ff6b7a]"
              >
                <Download className="w-4 h-4 mr-1" />
                Instalar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

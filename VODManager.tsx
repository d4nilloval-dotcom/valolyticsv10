import { useState, useMemo } from 'react';
import {
  Video,
  Plus,
  Clock,
  Bookmark,
  Trash2,
  ExternalLink,
  Youtube,
  Twitch,
  Cloud,
  FileVideo,
  Edit2,
  X,
} from 'lucide-react';
import { useVODStore } from '@/store/vodStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VOD, VODTimestamp } from '@/types/vod';

const PLATFORM_ICONS = {
  YOUTUBE: Youtube,
  TWITCH: Twitch,
  CLOUD: Cloud,
  LOCAL: FileVideo,
};

const TIMESTAMP_COLORS: Record<VODTimestamp['type'], string> = {
  ROUND_START: 'bg-green-500',
  ROUND_END: 'bg-red-500',
  KILL: 'bg-orange-500',
  CLUTCH: 'bg-purple-500',
  ECO_WIN: 'bg-yellow-500',
  EXECUTE: 'bg-blue-500',
  CUSTOM: 'bg-gray-500',
};

const TIMESTAMP_LABELS: Record<VODTimestamp['type'], string> = {
  ROUND_START: 'Inicio Ronda',
  ROUND_END: 'Fin Ronda',
  KILL: 'Kill',
  CLUTCH: 'Clutch',
  ECO_WIN: 'Eco Win',
  EXECUTE: 'Execute',
  CUSTOM: 'Personalizado',
};

export function VODManager() {
  const [showVODDialog, setShowVODDialog] = useState(false);
  const [showTimestampDialog, setShowTimestampDialog] = useState(false);
  const [editingVOD, setEditingVOD] = useState<VOD | null>(null);
  const [selectedVOD, setSelectedVOD] = useState<VOD | null>(null);
  const [filterMatch, setFilterMatch] = useState<string>('ALL');

  const { vods, addVOD, updateVOD, deleteVOD, addTimestamp, removeTimestamp } = useVODStore();

  const filteredVODs = useMemo(() => {
    if (filterMatch === 'ALL') return vods;
    return vods.filter((v) => v.matchId === filterMatch);
  }, [vods, filterMatch]);

  const handleAddVOD = () => {
    setEditingVOD(null);
    setShowVODDialog(true);
  };

  const handleEditVOD = (vod: VOD) => {
    setEditingVOD(vod);
    setShowVODDialog(true);
  };

  const handleSaveVOD = (formData: FormData) => {
    const vodData = {
      matchId: formData.get('matchId') as string,
      title: formData.get('title') as string,
      url: formData.get('url') as string,
      platform: (formData.get('platform') as VOD['platform']) || 'YOUTUBE',
      duration: parseInt(formData.get('duration') as string) || undefined,
      notes: formData.get('notes') as string,
      timestamps: editingVOD?.timestamps || [],
      uploadedAt: editingVOD?.uploadedAt || Date.now(),
    };

    if (editingVOD) {
      updateVOD(editingVOD.id, vodData);
    } else {
      addVOD(vodData);
    }
    setShowVODDialog(false);
  };

  const handleAddTimestamp = (formData: FormData) => {
    if (!selectedVOD) return;

    const timestamp = {
      time: parseInt(formData.get('time') as string) || 0,
      label: formData.get('label') as string,
      type: (formData.get('type') as VODTimestamp['type']) || 'CUSTOM',
      round: parseInt(formData.get('round') as string) || undefined,
      description: formData.get('description') as string,
    };

    addTimestamp(selectedVOD.id, timestamp);
    setShowTimestampDialog(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-[#ff4655]" />
            Gestor de VODs
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Administra videos y timestamps de partidos
          </p>
        </div>
        <Button onClick={handleAddVOD} className="bg-[#ff4655] hover:bg-[#ff6b7a] text-white">
          <Plus className="w-4 h-4 mr-1" />
          Añadir VOD
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total VODs</p>
          <p className="text-2xl font-bold text-white mt-1">{vods.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Timestamps</p>
          <p className="text-2xl font-bold text-white mt-1">
            {vods.reduce((acc, v) => acc + v.timestamps.length, 0)}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-gray-400 text-sm">Plataforma Principal</p>
          <p className="text-lg font-bold text-white mt-1">
            {vods.length > 0
              ? Object.entries(
                  vods.reduce((acc, v) => {
                    acc[v.platform] = (acc[v.platform] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
              : 'N/A'}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-gray-400 text-sm">Con Partido</p>
          <p className="text-2xl font-bold text-white mt-1">
            {vods.filter((v) => v.matchId).length}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">Filtrar por Match ID:</span>
        <input
          type="text"
          value={filterMatch === 'ALL' ? '' : filterMatch}
          onChange={(e) => setFilterMatch(e.target.value || 'ALL')}
          placeholder="Introduce match ID..."
          className="px-3 py-1.5 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-sm text-white focus:border-[#ff4655] focus:outline-none"
        />
      </div>

      {/* VODs List */}
      <div className="space-y-4">
        {filteredVODs.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No hay VODs registrados</p>
            <p className="text-gray-600 text-sm mt-1">
              Añade videos de partidos para analizarlos
            </p>
          </div>
        ) : (
          filteredVODs.map((vod) => {
            const PlatformIcon = PLATFORM_ICONS[vod.platform];

            return (
              <div key={vod.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#1a1a2e] rounded-lg flex items-center justify-center">
                    <PlatformIcon className="w-6 h-6 text-[#ff4655]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold truncate">{vod.title}</h3>
                      {vod.matchId && (
                        <span className="px-2 py-0.5 bg-[#1a1a2e] rounded text-xs text-gray-400">
                          {vod.matchId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {vod.duration ? formatTime(vod.duration) : 'Sin duración'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        {vod.timestamps.length} timestamps
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(vod.uploadedAt || vod.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    {vod.notes && (
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{vod.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={vod.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                    <button
                      onClick={() => handleEditVOD(vod)}
                      className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteVOD(vod.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Timestamps */}
                {vod.timestamps.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#1a1a2e]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Timestamps</span>
                      <button
                        onClick={() => {
                          setSelectedVOD(vod);
                          setShowTimestampDialog(true);
                        }}
                        className="text-xs text-[#ff4655] hover:underline"
                      >
                        + Añadir
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vod.timestamps
                        .sort((a, b) => a.time - b.time)
                        .map((ts) => (
                          <a
                            key={ts.id}
                            href={`${vod.url}${vod.platform === 'YOUTUBE' ? `&t=${ts.time}` : ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2 py-1 bg-[#0f0f1e] rounded text-xs hover:bg-[#1a1a2e] transition-colors"
                          >
                            <div className={cn('w-1.5 h-1.5 rounded-full', TIMESTAMP_COLORS[ts.type])} />
                            <span className="text-gray-300">{formatTime(ts.time)}</span>
                            <span className="text-gray-500 truncate max-w-[100px]">{ts.label}</span>
                            {ts.round && (
                              <span className="text-gray-600">R{ts.round}</span>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                removeTimestamp(vod.id, ts.id);
                              }}
                              className="ml-1 text-gray-600 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {vod.timestamps.length === 0 && (
                  <div className="mt-4 pt-4 border-t border-[#1a1a2e]">
                    <button
                      onClick={() => {
                        setSelectedVOD(vod);
                        setShowTimestampDialog(true);
                      }}
                      className="text-sm text-[#ff4655] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir primer timestamp
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* VOD Dialog */}
      <Dialog open={showVODDialog} onOpenChange={setShowVODDialog}>
        <DialogContent className="bg-[#0f0f1e] border-[#1a1a2e] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVOD ? 'Editar VOD' : 'Nuevo VOD'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveVOD(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm text-gray-400">Título</label>
              <input
                name="title"
                defaultValue={editingVOD?.title}
                required
                placeholder="Ej: Scrim vs Team Liquid"
                className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">URL del Video</label>
              <input
                name="url"
                type="url"
                defaultValue={editingVOD?.url}
                required
                placeholder="https://youtube.com/..."
                className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400">Plataforma</label>
                <select
                  name="platform"
                  defaultValue={editingVOD?.platform || 'YOUTUBE'}
                  className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
                >
                  <option value="YOUTUBE">YouTube</option>
                  <option value="TWITCH">Twitch</option>
                  <option value="CLOUD">Cloud</option>
                  <option value="LOCAL">Local</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Duración (seg)</label>
                <input
                  name="duration"
                  type="number"
                  defaultValue={editingVOD?.duration}
                  placeholder="3600"
                  className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Partido Asociado (Match ID)</label>
              <input
                name="matchId"
                type="text"
                defaultValue={editingVOD?.matchId || ''}
                placeholder="Ej: match-001"
                className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Notas</label>
              <textarea
                name="notes"
                defaultValue={editingVOD?.notes}
                rows={3}
                placeholder="Notas sobre el video..."
                className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none resize-none"
              />
            </div>
            <Button type="submit" className="w-full bg-[#ff4655] hover:bg-[#ff6b7a]">
              {editingVOD ? 'Guardar' : 'Añadir VOD'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Timestamp Dialog */}
      <Dialog open={showTimestampDialog} onOpenChange={setShowTimestampDialog}>
        <DialogContent className="bg-[#0f0f1e] border-[#1a1a2e] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir Timestamp</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddTimestamp(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400">Tiempo (segundos)</label>
                <input
                  name="time"
                  type="number"
                  required
                  min={0}
                  placeholder="120"
                  className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Ronda (opcional)</label>
                <input
                  name="round"
                  type="number"
                  min={1}
                  max={24}
                  placeholder="5"
                  className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Etiqueta</label>
              <input
                name="label"
                required
                placeholder="Ej: Pistol round win"
                className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Tipo</label>
              <select
                name="type"
                className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none"
              >
                {Object.entries(TIMESTAMP_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Descripción</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Detalles adicionales..."
                className="w-full mt-1 px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white focus:border-[#ff4655] focus:outline-none resize-none"
              />
            </div>
            <Button type="submit" className="w-full bg-[#ff4655] hover:bg-[#ff6b7a]">
              Añadir Timestamp
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

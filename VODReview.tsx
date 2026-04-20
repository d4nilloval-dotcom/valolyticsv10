import { useState, useRef, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVODStore } from '@/store/vodStore';

interface ReviewComment {
  id: string;
  timestamp: number;
  text: string;
  category: 'TACTIC' | 'MISTAKE' | 'GOOD_PLAY' | 'TIP' | 'OTHER';
  author: string;
  createdAt: number;
}

const CATEGORY_COLORS: Record<ReviewComment['category'], { bg: string; text: string }> = {
  TACTIC: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  MISTAKE: { bg: 'bg-red-500/20', text: 'text-red-400' },
  GOOD_PLAY: { bg: 'bg-green-500/20', text: 'text-green-400' },
  TIP: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  OTHER: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

const CATEGORY_LABELS: Record<ReviewComment['category'], string> = {
  TACTIC: 'Táctica',
  MISTAKE: 'Error',
  GOOD_PLAY: 'Buena jugada',
  TIP: 'Consejo',
  OTHER: 'Otro',
};

export function VODReview() {
  const { vods } = useVODStore();
  const [selectedVOD, setSelectedVOD] = useState(vods[0]?.id || '');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newCommentCategory, setNewCommentCategory] = useState<ReviewComment['category']>('OTHER');
  const [filterCategory, setFilterCategory] = useState<ReviewComment['category'] | 'ALL'>('ALL');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const vod = vods.find((v) => v.id === selectedVOD);

  const filteredComments = comments.filter(
    (c) => filterCategory === 'ALL' || c.category === filterCategory
  );

  useEffect(() => {
    // Load comments from localStorage for this VOD
    const saved = localStorage.getItem(`vod_comments_${selectedVOD}`);
    if (saved) {
      setComments(JSON.parse(saved));
    } else {
      setComments([]);
    }
  }, [selectedVOD]);

  const saveComments = (newComments: ReviewComment[]) => {
    setComments(newComments);
    localStorage.setItem(`vod_comments_${selectedVOD}`, JSON.stringify(newComments));
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment: ReviewComment = {
      id: crypto.randomUUID(),
      timestamp: currentTime,
      text: newComment,
      category: newCommentCategory,
      author: 'Coach',
      createdAt: Date.now(),
    };

    saveComments([...comments, comment].sort((a, b) => a.timestamp - b.timestamp));
    setNewComment('');
    setShowAddComment(false);
  };

  const deleteComment = (id: string) => {
    saveComments(comments.filter((c) => c.id !== id));
  };

  const updateComment = (id: string) => {
    if (!editText.trim()) return;
    
    saveComments(
      comments.map((c) => (c.id === id ? { ...c, text: editText } : c))
    );
    setEditingComment(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportComments = () => {
    const data = {
      vod: vod?.title,
      comments: comments.map((c) => ({
        time: formatTime(c.timestamp),
        category: CATEGORY_LABELS[c.category],
        comment: c.text,
      })),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vod_review_${vod?.title || 'unknown'}_${Date.now()}.json`;
    link.click();
  };

  const jumpToPrevComment = () => {
    const prev = comments
      .filter((c) => c.timestamp < currentTime)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    if (prev) seekTo(prev.timestamp);
  };

  const jumpToNextComment = () => {
    const next = comments
      .filter((c) => c.timestamp > currentTime)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    if (next) seekTo(next.timestamp);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="w-7 h-7 text-[#ff4655]" />
            VOD Review System
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Añade comentarios y análisis por timestamp
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedVOD}
            onChange={(e) => setSelectedVOD(e.target.value)}
            className="px-3 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg text-white text-sm"
          >
            {vods.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
          <Button onClick={exportComments} variant="outline" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {vods.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No hay VODs disponibles</p>
          <p className="text-gray-600 text-sm mt-1">
            Añade VODs en la sección "VODs" primero
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-xl p-4">
              {/* Video placeholder - in real app would be actual video */}
              <div className="aspect-video bg-[#0f0f1e] rounded-lg flex items-center justify-center relative">
                {vod?.url ? (
                  <video
                    ref={videoRef}
                    src={vod.url}
                    className="w-full h-full rounded-lg"
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                ) : (
                  <div className="text-center">
                    <Video className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">VOD no disponible para reproducción</p>
                    <p className="text-gray-600 text-sm">URL: {vod?.url || 'No URL'}</p>
                  </div>
                )}

                {/* Comment markers on timeline */}
                <div className="absolute bottom-12 left-4 right-4 h-1 bg-gray-700 rounded">
                  {filteredComments.map((comment) => (
                    <button
                      key={comment.id}
                      onClick={() => seekTo(comment.timestamp)}
                      className={cn(
                        'absolute w-2 h-4 -mt-1.5 rounded hover:scale-125 transition-transform',
                        CATEGORY_COLORS[comment.category].bg.replace('/20', '')
                      )}
                      style={{ left: `${(comment.timestamp / (vod?.duration || 3600)) * 100}%` }}
                      title={`${formatTime(comment.timestamp)}: ${comment.text}`}
                    />
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 bg-[#ff4655] rounded-full flex items-center justify-center hover:bg-[#ff6b7a] transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={vod?.duration || 3600}
                    value={currentTime}
                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <span className="text-white font-mono">
                  {formatTime(currentTime)} / {formatTime(vod?.duration || 0)}
                </span>

                <div className="flex gap-1">
                  <button
                    onClick={jumpToPrevComment}
                    className="p-2 hover:bg-[#1a1a2e] rounded-lg"
                    title="Comentario anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={jumpToNextComment}
                    className="p-2 hover:bg-[#1a1a2e] rounded-lg"
                    title="Siguiente comentario"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Add Comment */}
            <div className="glass-card rounded-xl p-4">
              {!showAddComment ? (
                <button
                  onClick={() => setShowAddComment(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-[#0f0f1e] rounded-lg hover:bg-[#1a1a2e] transition-colors"
                >
                  <Plus className="w-5 h-5 text-[#ff4655]" />
                  <span className="text-white">Añadir comentario en {formatTime(currentTime)}</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(Object.keys(CATEGORY_COLORS) as ReviewComment['category'][]).map((cat) => {
                      const { text } = CATEGORY_COLORS[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() => setNewCommentCategory(cat)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-sm transition-colors',
                            newCommentCategory === cat
                              ? CATEGORY_COLORS[cat].bg + ' ' + text
                              : 'bg-[#1a1a2e] text-gray-400'
                          )}
                        >
                          {CATEGORY_LABELS[cat]}
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe tu análisis..."
                    className="w-full px-3 py-2 bg-[#0f0f1e] border border-[#2a2a3e] rounded-lg text-white resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => setShowAddComment(false)} variant="outline" className="flex-1">
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button onClick={addComment} className="flex-1 bg-[#ff4655] hover:bg-[#ff6b7a]">
                      <Save className="w-4 h-4 mr-1" />
                      Guardar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#ff4655]" />
                Comentarios ({filteredComments.length})
              </h3>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as ReviewComment['category'] | 'ALL')}
                className="px-2 py-1 bg-[#0f0f1e] border border-[#2a2a3e] rounded text-sm text-white"
              >
                <option value="ALL">Todos</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredComments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {comments.length === 0
                    ? 'No hay comentarios aún'
                    : 'No hay comentarios en esta categoría'}
                </p>
              ) : (
                filteredComments.map((comment) => {
                  const { bg, text } = CATEGORY_COLORS[comment.category];
                  const isEditing = editingComment === comment.id;

                  return (
                    <div
                      key={comment.id}
                      className={cn('p-3 rounded-lg', bg)}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => seekTo(comment.timestamp)}
                          className="flex items-center gap-1 text-xs font-mono text-gray-400 hover:text-white"
                        >
                          <Clock className="w-3 h-3" />
                          {formatTime(comment.timestamp)}
                        </button>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded', bg, text)}>
                          {CATEGORY_LABELS[comment.category]}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-2 py-1 bg-[#0f0f1e] rounded text-white text-sm"
                            rows={2}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingComment(null)}
                              className="p-1 hover:bg-red-500/20 rounded"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                            <button
                              onClick={() => updateComment(comment.id)}
                              className="p-1 hover:bg-green-500/20 rounded"
                            >
                              <Save className="w-4 h-4 text-green-400" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-white text-sm">{comment.text}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => {
                                setEditingComment(comment.id);
                                setEditText(comment.text);
                              }}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Edit2 className="w-3 h-3 text-gray-400" />
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="p-1 hover:bg-red-500/20 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

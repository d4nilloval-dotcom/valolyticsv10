import { useState } from 'react';
import { 
  Trophy, 
  Plus, 
  Search, 
  Star, 
  Trash2, 
  Calendar,
  User
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface NoteForm {
  playerName: string;
  content: string;
  tags: string;
  rating: number;
}

const defaultForm: NoteForm = {
  playerName: '',
  content: '',
  tags: '',
  rating: 3
};

const commonTags = [
  'Mecánica', 'Game Sense', 'Comms', 'Liderazgo', 
  'Entry', 'Support', 'Clutch', 'Consistency'
];

export function Scouting() {
  const { scoutingNotes, addScoutingNote, deleteScoutingNote, getPlayerStats } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<NoteForm>(defaultForm);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const players = getPlayerStats('ALL');
  const playerNames = players.map(p => p.name);

  const filteredNotes = scoutingNotes.filter(note => {
    const matchesSearch = note.playerName.toLowerCase().includes(search.toLowerCase()) ||
                         note.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !filterTag || note.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allTags = Array.from(new Set(scoutingNotes.flatMap(n => n.tags)));

  const handleSave = () => {
    const note = {
      id: crypto.randomUUID(),
      playerName: formData.playerName,
      content: formData.content,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      rating: formData.rating,
      date: new Date().toISOString().split('T')[0],
      matchId: undefined
    };
    addScoutingNote(note);
    setFormData(defaultForm);
    setIsDialogOpen(false);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-400';
    if (rating >= 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRatingBg = (rating: number) => {
    if (rating >= 4) return 'bg-green-500/10';
    if (rating >= 3) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-pro pl-10 w-64"
            />
          </div>
          
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="input-pro"
          >
            <option value="">Todas las etiquetas</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4" />
              Nueva Nota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg"
            style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 15% 20%)' }}
          >
            <DialogHeader>
              <DialogTitle>Nueva Nota de Scouting</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Jugador</label>
                <select
                  value={formData.playerName}
                  onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                  className="input-pro w-full"
                >
                  <option value="">Seleccionar jugador</option>
                  {playerNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Contenido</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input-pro w-full h-32 resize-none"
                  placeholder="Observaciones sobre el jugador..."
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="input-pro w-full"
                  placeholder="ej: Mecánica, Entry, Clutch"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const current = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
                        if (!current.includes(tag)) {
                          setFormData({ ...formData, tags: [...current, tag].join(', ') });
                        }
                      }}
                      className="px-2 py-1 rounded-full text-xs bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Valoración</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        formData.rating >= star ? "text-yellow-400" : "text-muted-foreground"
                      )}
                    >
                      <Star className={cn(
                        "w-6 h-6",
                        formData.rating >= star && "fill-current"
                      )} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="btn-primary"
                  disabled={!formData.playerName || !formData.content}
                >
                  Guardar Nota
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Notas</p>
          <p className="text-2xl font-bold">{scoutingNotes.length}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Jugadores Evaluados</p>
          <p className="text-2xl font-bold">
            {new Set(scoutingNotes.map(n => n.playerName)).size}
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Valoración Media</p>
          <p className="text-2xl font-bold text-yellow-400">
            {scoutingNotes.length > 0 
              ? (scoutingNotes.reduce((a, b) => a + b.rating, 0) / scoutingNotes.length).toFixed(1)
              : '-'}
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Etiquetas</p>
          <p className="text-2xl font-bold">{allTags.length}</p>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay notas de scouting</p>
          <p className="text-sm mt-1">Crea tu primera nota para comenzar a evaluar jugadores</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="glass-card p-5 group hover:border-red-500/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{note.playerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    getRatingBg(note.rating),
                    getRatingColor(note.rating)
                  )}>
                    {note.rating}/5
                  </span>
                  <button
                    onClick={() => deleteScoutingNote(note.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {note.content}
              </p>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                {note.tags.map((tag, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {note.date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

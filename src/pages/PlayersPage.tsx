import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Trash2, Edit2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Player } from '@/lib/db';

function PlayerStatusBadge({ status }: { status: Player['status'] }) {
  const map = {
    waiting: { label: 'Waiting', cls: 'bg-status-waiting/15 text-status-waiting border-status-waiting/30', dot: 'bg-status-waiting' },
    playing: { label: 'Playing', cls: 'bg-status-playing/15 text-status-playing border-status-playing/30', dot: 'bg-status-playing animate-pulse' },
    finished: { label: 'Finished', cls: 'bg-muted/40 text-muted-foreground border-border/50', dot: 'bg-muted-foreground' },
  };
  const s = map[status];
  return (
    <Badge variant="outline" className={`${s.cls} font-display text-[10px] tracking-widest flex items-center gap-1 px-2 py-0.5`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </Badge>
  );
}

export default function PlayersPage() {
  const { players, addPlayer, updatePlayer, deletePlayer } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'waiting' | 'playing' | 'finished'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');

  const filtered = players
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addPlayer(newName.trim());
    setNewName('');
    setShowAdd(false);
  };

  const handleEdit = async () => {
    if (!editPlayer || !editName.trim()) return;
    await updatePlayer({ ...editPlayer, name: editName.trim() });
    setEditPlayer(null);
  };

  const filterLabels: Record<string, string> = { all: 'All', waiting: 'Waiting', playing: 'Playing', finished: 'Finished' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-widest text-gradient">Players</h1>
          <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">{players.length} total players</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="h-10 font-display tracking-widest text-xs elevation-1 hover:elevation-2 transition-all">
          <UserPlus className="mr-2 h-4 w-4" /> Add Player
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-secondary/40 border-border/50 focus:border-primary/40 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'waiting', 'playing', 'finished'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'ghost'}
              size="sm"
              className={`h-11 px-4 font-display tracking-widest text-[11px] transition-all ${
                filter === f ? 'elevation-1' : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-border/40'
              }`}
              onClick={() => setFilter(f)}
            >
              {filterLabels[f]}
            </Button>
          ))}
        </div>
      </div>

      {/* Player list */}
      <div className="rounded-xl border border-border/50 overflow-hidden elevation-1">
        <div className="grid grid-cols-[1fr_90px_55px_55px_55px_70px_70px] gap-2 px-4 py-3 bg-secondary/60 text-[11px] font-display tracking-widest text-muted-foreground border-b border-border/50">
          <span>Name</span>
          <span className="text-center">Status</span>
          <span className="text-center">GP</span>
          <span className="text-center">W</span>
          <span className="text-center">L</span>
          <span className="text-center">Pts</span>
          <span className="text-center">Actions</span>
        </div>
        <AnimatePresence>
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: i * 0.03 }}
              className={`grid grid-cols-[1fr_90px_55px_55px_55px_70px_70px] gap-2 px-4 py-3 items-center min-h-[52px] border-t border-border/30 hover:bg-accent/40 transition-colors ${
                i % 2 === 0 ? 'bg-card' : 'bg-card/60'
              }`}
            >
              <span className="font-medium text-sm truncate">{p.name}</span>
              <span className="flex justify-center"><PlayerStatusBadge status={p.status} /></span>
              <span className="text-center text-sm text-muted-foreground">{p.gamesPlayed}</span>
              <span className="text-center text-sm text-status-available font-semibold">{p.wins}</span>
              <span className="text-center text-sm text-status-playing">{p.losses}</span>
              <span className="text-center text-sm font-display font-bold text-primary">{p.points}</span>
              <div className="flex justify-center gap-1">
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  onClick={() => { setEditPlayer(p); setEditName(p.name); }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => deletePlayer(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-14 text-muted-foreground text-sm">No players found</div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm bg-card border-border/60 elevation-4">
          <DialogHeader><DialogTitle className="font-display tracking-widest text-base">Add Player</DialogTitle></DialogHeader>
          <Input
            placeholder="Player name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="h-11 bg-secondary/40 border-border/50"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)} className="font-display tracking-wider text-xs">Cancel</Button>
            <Button onClick={handleAdd} disabled={!newName.trim()} className="font-display tracking-widest text-xs elevation-1">
              <Plus className="mr-2 h-3.5 w-3.5" /> Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPlayer} onOpenChange={() => setEditPlayer(null)}>
        <DialogContent className="max-w-sm bg-card border-border/60 elevation-4">
          <DialogHeader><DialogTitle className="font-display tracking-widest text-base">Edit Player</DialogTitle></DialogHeader>
          <Input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="h-11 bg-secondary/40 border-border/50"
            onKeyDown={e => e.key === 'Enter' && handleEdit()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditPlayer(null)} className="font-display tracking-wider text-xs">Cancel</Button>
            <Button onClick={handleEdit} disabled={!editName.trim()} className="font-display tracking-widest text-xs elevation-1">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

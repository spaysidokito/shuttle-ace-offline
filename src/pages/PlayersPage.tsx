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
    waiting: { label: 'Waiting', cls: 'bg-status-waiting/20 text-status-waiting border-status-waiting/30' },
    playing: { label: 'Playing', cls: 'bg-status-playing/20 text-status-playing border-status-playing/30' },
    finished: { label: 'Finished', cls: 'bg-muted/50 text-muted-foreground border-border' },
  };
  const s = map[status];
  return <Badge variant="outline" className={`${s.cls} font-display text-[10px] tracking-wider`}>{s.label}</Badge>;
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Players</h1>
          <p className="text-sm text-muted-foreground mt-1">{players.length} total players</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="h-11 font-display tracking-wider">
          <UserPlus className="mr-2 h-4 w-4" /> Add Player
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'waiting', 'playing', 'finished'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'secondary'}
              size="sm"
              className="h-11 px-4 font-display tracking-wider text-xs capitalize"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Player list */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_60px_60px_60px_80px_80px] gap-2 px-4 py-3 bg-secondary/50 text-xs font-display tracking-wider text-muted-foreground">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`grid grid-cols-[1fr_80px_60px_60px_60px_80px_80px] gap-2 px-4 py-3 items-center min-h-[52px] ${i % 2 === 0 ? 'bg-card' : 'bg-card/50'} border-t border-border`}
            >
              <span className="font-medium text-sm truncate">{p.name}</span>
              <span className="flex justify-center"><PlayerStatusBadge status={p.status} /></span>
              <span className="text-center text-sm text-muted-foreground">{p.gamesPlayed}</span>
              <span className="text-center text-sm text-status-available">{p.wins}</span>
              <span className="text-center text-sm text-status-playing">{p.losses}</span>
              <span className="text-center text-sm font-display font-bold">{p.points}</span>
              <div className="flex justify-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditPlayer(p); setEditName(p.name); }}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePlayer(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No players found</div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display tracking-wider">Add Player</DialogTitle></DialogHeader>
          <Input placeholder="Player name" value={newName} onChange={e => setNewName(e.target.value)} className="h-11"
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!newName.trim()} className="font-display tracking-wider">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPlayer} onOpenChange={() => setEditPlayer(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display tracking-wider">Edit Player</DialogTitle></DialogHeader>
          <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-11"
            onKeyDown={e => e.key === 'Enter' && handleEdit()} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditPlayer(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editName.trim()} className="font-display tracking-wider">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, X, Users, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { type GameSession } from '@/lib/db';

function SessionCard({ session, players, onClose }: { session: GameSession; players: ReturnType<typeof useApp>['players']; onClose: () => void }) {
  const joinedPlayers = session.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean);

  const copyCode = () => {
    navigator.clipboard.writeText(session.joinCode);
    toast.success('Join code copied!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl border bg-card elevation-2 overflow-hidden ${session.status === 'active' ? 'border-primary/30' : 'border-border/40'}`}
    >
      <div className={`h-1 ${session.status === 'active' ? 'bg-gradient-to-r from-primary to-orange-400' : 'bg-border/40'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display tracking-widest text-base">{session.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(session.createdAt).toLocaleDateString()} · {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Badge variant="outline" className={session.status === 'active'
            ? 'bg-status-available/15 text-status-available border-status-available/30 font-display text-[10px] tracking-widest'
            : 'bg-muted/40 text-muted-foreground border-border/50 font-display text-[10px] tracking-widest'
          }>
            {session.status === 'active' ? '● ACTIVE' : '✓ CLOSED'}
          </Badge>
        </div>

        {/* Join code */}
        {session.status === 'active' && (
          <div className="flex items-center gap-3 bg-secondary/60 rounded-xl p-4 mb-4 border border-border/40">
            <div className="flex-1">
              <p className="text-[10px] font-display tracking-widest text-muted-foreground mb-1">JOIN CODE</p>
              <p className="font-display text-3xl tracking-widest text-primary font-bold">{session.joinCode}</p>
            </div>
            <button onClick={copyCode} className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Players */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-display tracking-wider text-muted-foreground">{joinedPlayers.length} PLAYERS JOINED</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {joinedPlayers.length === 0
              ? <span className="text-xs text-muted-foreground italic">No players yet</span>
              : joinedPlayers.map(p => p && (
                <span key={p.id} className="px-2.5 py-1 rounded-full bg-accent border border-border/40 text-xs font-medium">{p.name}</span>
              ))
            }
          </div>
        </div>

        {session.status === 'active' && (
          <Button variant="outline" size="sm" onClick={onClose}
            className="w-full h-9 font-display tracking-widest text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all">
            <X className="mr-2 h-3.5 w-3.5" /> Close Session
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function SessionsPage() {
  const { sessions, players, createSession, closeSession } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [creating, setCreating] = useState(false);

  const active = sessions.filter(s => s.status === 'active');
  const closed = sessions.filter(s => s.status === 'closed');

  const handleCreate = async () => {
    if (!sessionName.trim()) return;
    setCreating(true);
    const s = await createSession(sessionName.trim());
    setCreating(false);
    setSessionName('');
    setShowCreate(false);
    toast.success(`Session created! Code: ${s.joinCode}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-widest text-gradient">Sessions</h1>
          <p className="text-xs text-muted-foreground mt-1.5">{active.length} active · {closed.length} closed</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="h-10 font-display tracking-widest text-xs elevation-1">
          <Plus className="mr-2 h-4 w-4" /> New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-full bg-secondary/60 flex items-center justify-center mx-auto mb-4 elevation-1">
            <Calendar className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground text-sm">No sessions yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <p className="text-xs font-display tracking-widest text-muted-foreground mb-3">ACTIVE</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {active.map(s => <SessionCard key={s.id} session={s} players={players} onClose={() => closeSession(s.id)} />)}
                </AnimatePresence>
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <p className="text-xs font-display tracking-widest text-muted-foreground mb-3">CLOSED</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closed.map(s => <SessionCard key={s.id} session={s} players={players} onClose={() => {}} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm bg-card border-border/60 elevation-4">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-base">New Game Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-xs font-display tracking-wider text-muted-foreground block">Session Name</label>
            <Input
              placeholder="e.g. Saturday Morning"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              className="h-11 bg-secondary/40 border-border/50"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">A unique join code will be generated automatically.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="font-display tracking-wider text-xs">Cancel</Button>
            <Button onClick={handleCreate} disabled={!sessionName.trim() || creating} className="font-display tracking-widest text-xs elevation-1">
              <Plus className="mr-2 h-3.5 w-3.5" /> Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

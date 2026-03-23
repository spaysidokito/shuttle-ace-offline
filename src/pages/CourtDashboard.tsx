import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { type Court, type Player, type Match } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Play, Square, Users, User, Zap, Trash2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

function StatusBadge({ status }: { status: Court['status'] }) {
  const map = {
    available: { label: 'Available', cls: 'bg-status-available/15 text-status-available border-status-available/30', dot: 'bg-status-available' },
    playing: { label: 'Playing', cls: 'bg-status-playing/15 text-status-playing border-status-playing/30', dot: 'bg-status-playing animate-pulse' },
    waiting: { label: 'Waiting', cls: 'bg-status-waiting/15 text-status-waiting border-status-waiting/30', dot: 'bg-status-waiting' },
  };
  const s = map[status];
  return (
    <Badge variant="outline" className={`${s.cls} font-display text-[10px] tracking-widest flex items-center gap-1.5 px-2.5 py-1`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </Badge>
  );
}

function CourtCard({ court }: { court: Court }) {
  const { players, startMatch, endMatch, getActiveMatchForCourt, getNextPlayersForMatch, settings, deleteCourt } = useApp();
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showEndMatch, setShowEndMatch] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>(settings.matchTypeDefault);
  const [winners, setWinners] = useState<string[]>([]);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    getActiveMatchForCourt(court.id).then(m => setActiveMatch(m || null));
  }, [court, getActiveMatchForCourt]);

  const courtPlayers = court.players.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
  const waitingPlayers = players.filter(p => p.status === 'waiting');
  const requiredCount = matchType === 'singles' ? 2 : 4;

  const handleAutoAssign = async () => {
    const next = await getNextPlayersForMatch(matchType);
    setSelectedPlayers(next.map(p => p.id));
  };

  const handleStartMatch = async () => {
    if (selectedPlayers.length !== requiredCount) return;
    await startMatch(court.id, selectedPlayers, matchType);
    setShowAssign(false);
    setSelectedPlayers([]);
  };

  const handleEndMatch = async () => {
    if (!activeMatch) return;
    await endMatch(activeMatch.id, winners);
    setShowEndMatch(false);
    setWinners([]);
    setFlashing(true);
    setTimeout(() => setFlashing(false), 1200);
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < requiredCount ? [...prev, id] : prev
    );
  };

  const toggleWinner = (id: string) => {
    setWinners(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  const isPlaying = court.status === 'playing';

  return (
    <>
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className={`rounded-xl border bg-card overflow-hidden elevation-2 hover:elevation-3 transition-all duration-300 ${flashing ? 'court-flash' : ''} ${isPlaying ? 'playing-border border-transparent' : 'border-border/60'}`}
      >
        <div className={`h-1 w-full ${isPlaying ? 'bg-gradient-to-r from-status-playing via-orange-400 to-status-playing' : court.status === 'available' ? 'bg-status-available/60' : 'bg-status-waiting/60'}`} />
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            {court.matchType === 'doubles' ? <Users className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
            <h3 className="font-display text-base tracking-widest">{court.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={court.status} />
            <button className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => { if (confirm(`Delete ${court.name}? This cannot be undone.`)) deleteCourt(court.id); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="p-4 min-h-[100px]">
          {courtPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="h-10 w-10 rounded-full bg-secondary/80 flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <span className="text-xs text-muted-foreground">No players assigned</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {courtPlayers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 bg-secondary/60 rounded-lg px-3 py-2 border border-border/30">
                  <span className="text-[10px] font-display text-primary/70 tracking-wider">P{i + 1}</span>
                  <span className="text-sm font-medium truncate">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 pb-4">
          {court.status === 'available' ? (
            <Button className="w-full h-11 font-display tracking-widest text-sm elevation-1 hover:elevation-2 transition-all"
              onClick={() => { setMatchType(settings.matchTypeDefault); setShowAssign(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Assign Players
            </Button>
          ) : court.status === 'playing' ? (
            <Button variant="outline" className="w-full h-11 font-display tracking-widest text-sm border-status-playing/40 text-status-playing hover:bg-status-playing/10 hover:border-status-playing/60 transition-all"
              onClick={() => setShowEndMatch(true)}>
              <Square className="mr-2 h-4 w-4 fill-current" /> End Match
            </Button>
          ) : null}
        </div>
      </motion.div>

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-md bg-card border-border/60 elevation-4">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-base">Assign Players — {court.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-display tracking-wider text-muted-foreground mb-2 block">Match Type</label>
              <Select value={matchType} onValueChange={(v) => { setMatchType(v as 'singles' | 'doubles'); setSelectedPlayers([]); }}>
                <SelectTrigger className="h-11 bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles">Singles (2 players)</SelectItem>
                  <SelectItem value="doubles">Doubles (4 players)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" className="w-full h-11 font-display tracking-widest text-sm border border-border/50 hover:border-primary/30 hover:bg-primary/10 transition-all" onClick={handleAutoAssign}>
              <Zap className="mr-2 h-4 w-4 text-primary" /> Auto-Select from Queue
            </Button>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Select {requiredCount} players</span>
              <span className="text-xs font-display text-primary">{selectedPlayers.length}/{requiredCount}</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {waitingPlayers.map(p => (
                <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent cursor-pointer min-h-[44px] border border-transparent hover:border-border/40 transition-all">
                  <Checkbox checked={selectedPlayers.includes(p.id)} onCheckedChange={() => togglePlayer(p.id)} />
                  <span className="text-sm font-medium flex-1">{p.name}</span>
                  <span className="text-xs font-display text-muted-foreground">{p.points}pts</span>
                </label>
              ))}
              {waitingPlayers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No waiting players</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAssign(false)} className="font-display tracking-wider text-xs">Cancel</Button>
            <Button disabled={selectedPlayers.length !== requiredCount} onClick={handleStartMatch} className="font-display tracking-widest text-xs elevation-1">
              <Play className="mr-2 h-3.5 w-3.5 fill-current" /> Start Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEndMatch} onOpenChange={setShowEndMatch}>
        <DialogContent className="max-w-md bg-card border-border/60 elevation-4">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-base">End Match — {court.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs font-display tracking-wider text-muted-foreground mb-3">Select the winner(s):</p>
            {courtPlayers.map(p => (
              <label key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent cursor-pointer min-h-[48px] border border-transparent hover:border-border/40 transition-all">
                <Checkbox checked={winners.includes(p.id)} onCheckedChange={() => toggleWinner(p.id)} />
                <span className="text-sm font-medium">{p.name}</span>
                {winners.includes(p.id) && <span className="ml-auto text-xs font-display text-status-available tracking-wider">WINNER</span>}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEndMatch(false)} className="font-display tracking-wider text-xs">Cancel</Button>
            <Button disabled={winners.length === 0} onClick={handleEndMatch} className="font-display tracking-widest text-xs bg-status-available hover:bg-status-available/90 elevation-1">
              Confirm & End
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CourtDashboard() {
  const { courts, addCourt, queue, players } = useApp();
  const queuePlayers = queue.map(q => players.find(p => p.id === q.playerId)).filter(Boolean) as Player[];
  const availableCount = courts.filter(c => c.status === 'available').length;
  const playingCount = courts.filter(c => c.status === 'playing').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-widest text-gradient">Court Dashboard</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-status-available" />
              {availableCount} available
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-status-playing animate-pulse" />
              {playingCount} playing
            </span>
          </div>
        </div>
        <Button onClick={addCourt} variant="outline" className="h-10 font-display tracking-widest text-xs border-border/60 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all">
          <Plus className="mr-2 h-4 w-4" /> Add Court
        </Button>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-secondary/40 border border-border/50 elevation-1">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-3.5 w-3.5 text-status-waiting" />
          <span className="text-xs font-display tracking-widest text-status-waiting">QUEUE</span>
          <span className="ml-auto text-xs font-display text-muted-foreground">{queuePlayers.length} waiting</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {queuePlayers.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">No players in queue</span>
          ) : (
            queuePlayers.map((p, i) => (
              <span key={p.id} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent border border-border/40 text-xs font-medium">
                <span className="text-[10px] font-display text-muted-foreground">#{i + 1}</span>
                {p.name}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map((court, i) => (
          <motion.div key={court.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <CourtCard court={court} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

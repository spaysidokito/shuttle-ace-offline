import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { type Court, type Player, type Match } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Play, Square, Users, User, Zap, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

function StatusBadge({ status }: { status: Court['status'] }) {
  const map = {
    available: { label: 'Available', cls: 'bg-status-available/20 text-status-available border-status-available/30' },
    playing: { label: 'Playing', cls: 'bg-status-playing/20 text-status-playing border-status-playing/30' },
    waiting: { label: 'Waiting', cls: 'bg-status-waiting/20 text-status-waiting border-status-waiting/30' },
  };
  const s = map[status];
  return <Badge variant="outline" className={`${s.cls} font-display text-xs tracking-wider`}>{s.label}</Badge>;
}

function CourtCard({ court }: { court: Court }) {
  const { players, startMatch, endMatch, getActiveMatchForCourt, getNextPlayersForMatch, settings, refreshAll, deleteCourt } = useApp();
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
    setTimeout(() => setFlashing(false), 1000);
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < requiredCount ? [...prev, id] : prev
    );
  };

  const toggleWinner = (id: string) => {
    setWinners(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg border border-border bg-card overflow-hidden ${flashing ? 'court-flash' : ''}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display text-lg tracking-wider">{court.name}</h3>
          <div className="flex items-center gap-2">
            {court.matchType === 'doubles' ? <Users className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
            <StatusBadge status={court.status} />
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (confirm(`Delete ${court.name}? This cannot be undone.`)) {
                  deleteCourt(court.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Players */}
        <div className="p-4 min-h-[100px]">
          {courtPlayers.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-6">No players assigned</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {courtPlayers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 bg-secondary/50 rounded-md px-3 py-2">
                  <span className="text-xs font-display text-muted-foreground">P{i + 1}</span>
                  <span className="text-sm font-medium truncate">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-border">
          {court.status === 'available' ? (
            <Button
              className="w-full h-12 font-display tracking-wider text-base"
              onClick={() => { setMatchType(settings.matchTypeDefault); setShowAssign(true); }}
            >
              <Plus className="mr-2 h-5 w-5" /> Assign Players
            </Button>
          ) : court.status === 'playing' ? (
            <Button
              variant="destructive"
              className="w-full h-12 font-display tracking-wider text-base"
              onClick={() => setShowEndMatch(true)}
            >
              <Square className="mr-2 h-5 w-5" /> End Match
            </Button>
          ) : null}
        </div>
      </motion.div>

      {/* Assign Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Assign Players - {court.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Match Type</label>
              <Select value={matchType} onValueChange={(v) => { setMatchType(v as 'singles' | 'doubles'); setSelectedPlayers([]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles">Singles (2 players)</SelectItem>
                  <SelectItem value="doubles">Doubles (4 players)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" className="w-full h-11 font-display tracking-wider" onClick={handleAutoAssign}>
              <Zap className="mr-2 h-4 w-4" /> Auto-Select from Queue
            </Button>
            <div className="text-sm text-muted-foreground">
              Select {requiredCount} players ({selectedPlayers.length}/{requiredCount})
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {waitingPlayers.map(p => (
                <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent cursor-pointer min-h-[44px]">
                  <Checkbox
                    checked={selectedPlayers.includes(p.id)}
                    onCheckedChange={() => togglePlayer(p.id)}
                  />
                  <span className="text-sm">{p.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{p.points}pts</span>
                </label>
              ))}
              {waitingPlayers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No waiting players</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button disabled={selectedPlayers.length !== requiredCount} onClick={handleStartMatch} className="font-display tracking-wider">
              <Play className="mr-2 h-4 w-4" /> Start Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Match Dialog */}
      <Dialog open={showEndMatch} onOpenChange={setShowEndMatch}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">End Match - {court.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select the winning player(s):</p>
            {courtPlayers.map(p => (
              <label key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent cursor-pointer min-h-[44px]">
                <Checkbox checked={winners.includes(p.id)} onCheckedChange={() => toggleWinner(p.id)} />
                <span className="text-sm font-medium">{p.name}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowEndMatch(false)}>Cancel</Button>
            <Button disabled={winners.length === 0} onClick={handleEndMatch} className="font-display tracking-wider bg-status-available hover:bg-status-available/90">
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Court Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{courts.filter(c => c.status === 'available').length} courts available</p>
        </div>
        <Button onClick={addCourt} variant="secondary" className="h-11 font-display tracking-wider">
          <Plus className="mr-2 h-4 w-4" /> Add Court
        </Button>
      </div>

      {/* Queue strip */}
      <div className="mb-6 p-3 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-display text-status-waiting tracking-wider">QUEUE</span>
          <Badge variant="outline" className="text-xs">{queuePlayers.length}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {queuePlayers.length === 0 ? (
            <span className="text-xs text-muted-foreground">No players in queue</span>
          ) : (
            queuePlayers.map(p => (
              <span key={p.id} className="px-3 py-1 rounded-full bg-accent text-xs font-medium">{p.name}</span>
            ))
          )}
        </div>
      </div>

      {/* Courts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map(court => (
          <CourtCard key={court.id} court={court} />
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { type Court, type Player, type Match } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Play, Square, Users, User, Zap, Trash2, Clock } from 'lucide-react';

function StatusBadge({ status }: { status: Court['status'] }) {
  const config = {
    available: { label: 'Available', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    playing: { label: 'In Play', className: 'bg-primary/10 text-primary border-primary/20' },
    waiting: { label: 'Waiting', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  };
  const { label, className } = config[status];
  return (
    <Badge variant="outline" className={`${className} text-xs font-semibold`}>
      {label}
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
    if (court.status === 'playing') {
      getActiveMatchForCourt(court.id).then(m => setActiveMatch(m || null));
    } else {
      setActiveMatch(null);
    }
  }, [court.id, court.status, getActiveMatchForCourt]);

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
    if (!activeMatch) {
      console.error('No active match found');
      return;
    }
    if (winners.length === 0) {
      console.error('No winners selected');
      return;
    }
    try {
      console.log('Ending match:', activeMatch.id, 'Winners:', winners);
      await endMatch(activeMatch.id, winners);
      setShowEndMatch(false);
      setWinners([]);
      setFlashing(true);
      setTimeout(() => setFlashing(false), 1200);
    } catch (error) {
      console.error('Failed to end match:', error);
      alert('Failed to end match. Check console for details.');
    }
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
  const borderColor = isPlaying ? 'border-primary/30' : 'border-border';

  return (
    <>
      <div className={`rounded-lg border ${borderColor} bg-card transition-all hover:border-primary/20`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            {court.matchType === 'doubles' ? <Users className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
            <h3 className="font-semibold text-sm">{court.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={court.status} />
            <button 
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => { if (confirm(`Delete ${court.name}?`)) deleteCourt(court.id); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 min-h-[120px]">
          {courtPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mb-2 opacity-20" />
              <span className="text-sm">No players assigned</span>
            </div>
          ) : (
            <div className="space-y-2">
              {courtPlayers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 rounded bg-secondary border border-border">
                  <span className="text-xs font-semibold text-muted-foreground">P{i + 1}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-4 pb-4">
          {court.status === 'available' ? (
            <Button 
              className="w-full font-semibold" 
              onClick={() => { setMatchType(settings.matchTypeDefault); setShowAssign(true); }}
            >
              <Plus className="mr-2 h-4 w-4" /> Assign Players
            </Button>
          ) : court.status === 'playing' ? (
            <Button 
              variant="outline" 
              className="w-full font-semibold border-primary/20 text-primary hover:bg-primary/10"
              onClick={() => setShowEndMatch(true)}
            >
              <Square className="mr-2 h-4 w-4" /> End Match
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Assign Players — {court.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Match Type</label>
              <Select value={matchType} onValueChange={(v) => { setMatchType(v as 'singles' | 'doubles'); setSelectedPlayers([]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles">Singles (2 players)</SelectItem>
                  <SelectItem value="doubles">Doubles (4 players)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" className="w-full font-semibold" onClick={handleAutoAssign}>
              <Zap className="mr-2 h-4 w-4" /> Auto-Select from Queue
            </Button>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Select {requiredCount} players</span>
              <span className="font-semibold text-primary">{selectedPlayers.length}/{requiredCount}</span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {waitingPlayers.map(p => (
                <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent cursor-pointer border border-transparent hover:border-border transition-colors">
                  <Checkbox checked={selectedPlayers.includes(p.id)} onCheckedChange={() => togglePlayer(p.id)} />
                  <span className="text-sm font-medium flex-1">{p.name}</span>
                  <span className="text-xs text-muted-foreground font-semibold">{p.points} pts</span>
                </label>
              ))}
              {waitingPlayers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No waiting players</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button disabled={selectedPlayers.length !== requiredCount} onClick={handleStartMatch} className="font-semibold">
              <Play className="mr-2 h-4 w-4" /> Start Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEndMatch} onOpenChange={setShowEndMatch}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">End Match — {court.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium mb-3">Select the winner(s):</p>
            {courtPlayers.map(p => (
              <label key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent cursor-pointer border border-transparent hover:border-border transition-colors">
                <Checkbox checked={winners.includes(p.id)} onCheckedChange={() => toggleWinner(p.id)} />
                <span className="text-sm font-medium flex-1">{p.name}</span>
                {winners.includes(p.id) && <span className="text-xs font-bold text-green-400">Winner</span>}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEndMatch(false)}>Cancel</Button>
            <Button disabled={winners.length === 0} onClick={handleEndMatch} className="font-semibold">
              Confirm & End
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CourtDashboard() {
  const { courts, addCourt, queue, players, removePlayerFromQueue } = useApp();
  const queuePlayers = queue.map(q => players.find(p => p.id === q.playerId)).filter(Boolean) as Player[];
  const availableCount = courts.filter(c => c.status === 'available').length;
  const playingCount = courts.filter(c => c.status === 'playing').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courts</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {availableCount} available · {playingCount} in play
          </p>
        </div>
        <Button onClick={addCourt} variant="outline" className="font-semibold">
          <Plus className="mr-2 h-4 w-4" /> Add Court
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold">Queue</span>
            <span className="text-sm text-muted-foreground font-semibold">({queuePlayers.length})</span>
          </div>
          {queuePlayers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (confirm(`Remove all ${queuePlayers.length} players from queue?`)) {
                  for (const p of queuePlayers) {
                    await removePlayerFromQueue(p.id);
                  }
                }
              }}
              className="h-8 text-xs text-destructive hover:text-destructive font-semibold"
            >
              Clear All
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {queuePlayers.length === 0 ? (
            <span className="text-sm text-muted-foreground">No players in queue</span>
          ) : (
            queuePlayers.map((p, i) => (
              <span key={p.id} className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-sm font-medium hover:border-destructive/40 transition-colors">
                <span className="text-xs text-muted-foreground font-semibold">#{i + 1}</span>
                {p.name}
                <button
                  onClick={async () => {
                    if (confirm(`Remove ${p.name} from queue?`)) {
                      await removePlayerFromQueue(p.id);
                    }
                  }}
                  className="h-4 w-4 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-destructive transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map(court => (
          <CourtCard key={court.id} court={court} />
        ))}
      </div>
    </div>
  );
}

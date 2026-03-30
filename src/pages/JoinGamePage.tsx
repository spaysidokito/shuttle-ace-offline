import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hash, CheckCircle, Users, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { addPlayer as dbAddPlayer, updateAccount } from '@/lib/supabaseStore';

export default function JoinGamePage() {
  const { account, linkedPlayerId, logout } = useAuth();
  const { players, sessions, joinSession, refreshAll } = useApp();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const myPlayer = players.find(p => p.id === linkedPlayerId || p.accountId === account?.id);
  const activeSession = sessions.find(s => s.status === 'active' && myPlayer && s.playerIds.includes(myPlayer.id));
  const queuePos = myPlayer ? sessions
    .filter(s => s.status === 'active')
    .flatMap(s => s.playerIds)
    .indexOf(myPlayer.id) + 1 : 0;

  const handleJoin = async () => {
    if (!code.trim() || !account) return;
    setJoining(true);

    let playerId = myPlayer?.id;
    if (!playerId) {
      const newPlayer = await dbAddPlayer(account.name, account.id);
      playerId = newPlayer.id;
      await updateAccount({ ...account, playerId });
      await refreshAll();
    }

    if (!playerId) { setJoining(false); toast.error('Could not create player profile.'); return; }

    const session = await joinSession(code.trim().toUpperCase(), playerId);
    setJoining(false);
    if (!session) {
      toast.error('No session found with that code.');
    } else if ('error' in session) {
      toast.error(session.error);
    } else {
      setCode('');
      toast.success(`Joined session: ${session.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col"
      style={{ backgroundImage: 'radial-gradient(ellipse at 20% 0%, hsl(4 90% 58% / 0.08) 0%, transparent 50%)' }}>
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 backdrop-blur-sm bg-background/80">
        <span className="font-display text-lg tracking-widest text-gradient">RallyQ</span>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          {/* Welcome */}
          <div className="text-center mb-6">
            <p className="text-xs font-display tracking-widest text-muted-foreground">WELCOME BACK</p>
            <h2 className="font-display text-2xl tracking-widest mt-1">{account?.name}</h2>
          </div>

          {/* Active session status */}
          {activeSession && myPlayer && (
            <div className="rounded-xl border border-status-available/30 bg-status-available/10 p-5 elevation-2">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-status-available" />
                <span className="text-xs font-display tracking-widest text-status-available">IN SESSION</span>
              </div>
              <p className="font-display text-base tracking-wider mb-1">{activeSession.name}</p>
              <p className="text-xs text-muted-foreground">Code: <span className="text-primary font-display">{activeSession.joinCode}</span></p>
              <div className="mt-3 pt-3 border-t border-status-available/20">
                <p className="text-xs text-muted-foreground">Queue position</p>
                <p className="font-display text-3xl text-status-available font-bold">#{myPlayer.status === 'playing' ? '▶' : queuePos || '—'}</p>
                {myPlayer.status === 'playing' && <p className="text-xs text-status-playing mt-1">Currently playing!</p>}
              </div>
            </div>
          )}

          {/* Join form */}
          <div className="rounded-xl border border-border/50 bg-card p-5 elevation-2">
            <p className="text-xs font-display tracking-widest text-muted-foreground mb-4">
              {activeSession ? 'JOIN ANOTHER SESSION' : 'ENTER JOIN CODE'}
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="RQ-0000"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="pl-9 h-11 bg-secondary/40 border-border/50 font-display tracking-widest"
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  maxLength={7}
                />
              </div>
              <Button onClick={handleJoin} disabled={!code.trim() || joining} className="h-11 font-display tracking-widest text-xs px-5 elevation-1">
                Join
              </Button>
            </div>
          </div>

          {/* Player stats preview */}
          {myPlayer && (
            <div className="rounded-xl border border-border/50 bg-card p-5 elevation-1">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-display tracking-widest text-muted-foreground">YOUR STATS</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Played', value: myPlayer.gamesPlayed },
                  { label: 'Wins', value: myPlayer.wins },
                  { label: 'Points', value: myPlayer.points },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="font-display text-2xl font-bold text-primary">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

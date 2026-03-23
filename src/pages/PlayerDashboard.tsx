import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { ACHIEVEMENTS } from '@/lib/db';
import { Trophy, Activity, Target, Flame, LogOut, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlayerDashboard() {
  const { account, logout } = useAuth();
  const { players, courts, queue, sessions } = useApp();

  const myPlayer = players.find(p => p.accountId === account?.id || p.id === account?.playerId);
  const queueEntry = myPlayer ? queue.findIndex(q => q.playerId === myPlayer.id) : -1;
  const isInQueue = queueEntry >= 0;
  const myMatch = myPlayer?.status === 'playing'
    ? courts.find(c => c.players.includes(myPlayer.id))
    : null;
  const activeSession = sessions.find(s => s.status === 'active' && myPlayer && s.playerIds.includes(myPlayer.id));

  const winRate = myPlayer && myPlayer.gamesPlayed > 0
    ? Math.round((myPlayer.wins / myPlayer.gamesPlayed) * 100)
    : 0;

  const earnedAchievements = ACHIEVEMENTS.filter(a => myPlayer?.achievements?.includes(a.key));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !myPlayer?.achievements?.includes(a.key));

  return (
    <div className="min-h-screen bg-background"
      style={{ backgroundImage: 'radial-gradient(ellipse at 20% 0%, hsl(4 90% 58% / 0.08) 0%, transparent 50%)' }}>
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <span className="font-display text-lg tracking-widest text-gradient">RallyQ</span>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </header>

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
        {/* Profile header */}
        <div className="rounded-xl border border-border/50 bg-card p-5 elevation-2">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center shrink-0">
              <span className="font-display text-xl text-primary">{account?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl tracking-widest truncate">{account?.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {myPlayer?.winStreak && myPlayer.winStreak > 1 ? (
                  <span className="flex items-center gap-1 text-xs text-orange-400 font-display">
                    <Flame className="h-3.5 w-3.5" /> {myPlayer.winStreak} streak
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground">{earnedAchievements.length} achievements</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-primary">{myPlayer?.points ?? 0}</p>
              <p className="text-[10px] text-muted-foreground tracking-wider">POINTS</p>
            </div>
          </div>
        </div>

        {/* Live status */}
        {myMatch ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-status-playing/30 bg-status-playing/10 p-5 elevation-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-status-playing animate-pulse" />
              <span className="text-xs font-display tracking-widest text-status-playing">CURRENTLY PLAYING</span>
            </div>
            <p className="font-display text-base tracking-wider">{myMatch.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              With: {myMatch.players.filter(id => id !== myPlayer?.id).map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(', ')}
            </p>
          </motion.div>
        ) : isInQueue ? (
          <div className="rounded-xl border border-status-waiting/30 bg-status-waiting/10 p-5 elevation-2">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-status-waiting" />
              <span className="text-xs font-display tracking-widest text-status-waiting">IN QUEUE</span>
            </div>
            <p className="font-display text-4xl font-bold text-status-waiting">#{queueEntry + 1}</p>
            <p className="text-xs text-muted-foreground mt-1">Position in queue</p>
          </div>
        ) : activeSession ? (
          <div className="rounded-xl border border-border/50 bg-card p-5 elevation-1">
            <p className="text-xs font-display tracking-widest text-muted-foreground mb-1">SESSION</p>
            <p className="font-display text-base tracking-wider">{activeSession.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting to be added to queue by admin</p>
          </div>
        ) : null}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Matches', value: myPlayer?.gamesPlayed ?? 0, icon: Target, color: 'text-foreground' },
            { label: 'Wins', value: myPlayer?.wins ?? 0, icon: Trophy, color: 'text-status-available' },
            { label: 'Losses', value: myPlayer?.losses ?? 0, icon: Activity, color: 'text-status-playing' },
            { label: 'Win Rate', value: `${winRate}%`, icon: Star, color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/50 bg-card p-4 elevation-1">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <span className="text-[10px] font-display tracking-widest text-muted-foreground">{s.label.toUpperCase()}</span>
              </div>
              <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="rounded-xl border border-border/50 bg-card p-5 elevation-1">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-display tracking-widest text-muted-foreground">ACHIEVEMENTS</span>
            <span className="ml-auto text-xs font-display text-primary">{earnedAchievements.length}/{ACHIEVEMENTS.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {earnedAchievements.map(a => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="text-sm font-display tracking-wider">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
                <span className="ml-auto text-xs text-primary font-display">EARNED</span>
              </motion.div>
            ))}
            {lockedAchievements.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30 opacity-50">
                <span className="text-2xl grayscale">{a.icon}</span>
                <div>
                  <p className="text-sm font-display tracking-wider text-muted-foreground">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
                <span className="ml-auto text-xs text-muted-foreground font-display">LOCKED</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

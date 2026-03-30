import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { ACHIEVEMENTS } from '@/lib/db';
import { Trophy, Activity, Target, Flame, LogOut, Star, TrendingUp, Award, Zap, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getEloRank(elo: number): { label: string; color: string; icon: string } {
  if (elo >= 2000) return { label: 'Grandmaster', color: 'text-purple-400', icon: '👑' };
  if (elo >= 1800) return { label: 'Master', color: 'text-yellow-400', icon: '🏆' };
  if (elo >= 1600) return { label: 'Expert', color: 'text-blue-400', icon: '💎' };
  if (elo >= 1400) return { label: 'Advanced', color: 'text-green-400', icon: '⭐' };
  if (elo >= 1200) return { label: 'Intermediate', color: 'text-cyan-400', icon: '🎯' };
  return { label: 'Beginner', color: 'text-gray-400', icon: '🌱' };
}

export default function PlayerDashboard() {
  const { account, logout } = useAuth();
  const { players, courts, queue, sessions, matches } = useApp();
  const prevQueuePos = useRef<number>(-1);

  const myPlayer = players.find(p => p.accountId === account?.id || p.id === account?.playerId);
  const queueEntry = myPlayer ? queue.findIndex(q => q.playerId === myPlayer.id) : -1;
  const isInQueue = queueEntry >= 0;
  const queuePos = queueEntry + 1;
  const isUpNext = isInQueue && queuePos <= 4;

  const myMatch = myPlayer?.status === 'playing'
    ? courts.find(c => c.players.includes(myPlayer.id))
    : null;
  const activeSession = sessions.find(s => s.status === 'active' && myPlayer && s.playerIds.includes(myPlayer.id));

  const winRate = myPlayer && myPlayer.gamesPlayed > 0
    ? Math.round((myPlayer.wins / myPlayer.gamesPlayed) * 100)
    : 0;

  const earnedAchievements = ACHIEVEMENTS.filter(a => myPlayer?.achievements?.includes(a.key));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !myPlayer?.achievements?.includes(a.key));
  const playerElo = myPlayer?.elo ?? 1200;
  const eloRank = getEloRank(playerElo);

  const myMatches = myPlayer
    ? matches.filter(m => m.endedAt && m.players.includes(myPlayer.id)).slice(0, 10)
    : [];

  function playAlert() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) { /* ignore */ }
  }

  useEffect(() => {
    if (isUpNext && prevQueuePos.current > 4) playAlert();
    prevQueuePos.current = queuePos;
  }, [queuePos, isUpNext]);

  return (
    <div className="min-h-screen bg-background"
      style={{ backgroundImage: 'radial-gradient(ellipse at 20% 0%, hsl(4 90% 58% / 0.08) 0%, transparent 50%)' }}>
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <span className="font-display text-lg tracking-widest text-gradient">RallyQ</span>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </header>

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
        <AnimatePresence>
          {isUpNext && !myMatch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-4 flex items-center gap-3"
            >
              <div className="h-9 w-9 rounded-full bg-yellow-400/20 flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-yellow-400 animate-bounce" />
              </div>
              <div>
                <p className="font-display text-sm tracking-widest text-yellow-400">YOU'RE UP NEXT!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {queuePos === 1 ? "You're first in queue — get ready!" : `Position #${queuePos} — almost your turn`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 elevation-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-400" />
              <span className="text-xs font-display tracking-widest text-muted-foreground">SKILL RATING</span>
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display tracking-wider ${eloRank.color} bg-current/10 border border-current/20`}>
              <span className="text-base">{eloRank.icon}</span>
              {eloRank.label}
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <p className="font-display text-5xl font-bold text-gradient">{playerElo}</p>
            <span className="text-sm text-muted-foreground font-display tracking-wider">ELO</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Rating updates after each match based on opponent strength</span>
          </div>
        </div>

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
            <p className="font-display text-4xl font-bold text-status-waiting">#{queuePos}</p>
            <p className="text-xs text-muted-foreground mt-1">Position in queue</p>
          </div>
        ) : activeSession ? (
          <div className="rounded-xl border border-border/50 bg-card p-5 elevation-1">
            <p className="text-xs font-display tracking-widest text-muted-foreground mb-1">SESSION</p>
            <p className="font-display text-base tracking-wider">{activeSession.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting to be added to queue by admin</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'ELO Rating', value: playerElo, icon: Zap, color: eloRank.color },
            { label: 'Matches', value: myPlayer?.gamesPlayed ?? 0, icon: Target, color: 'text-foreground' },
            { label: 'Wins', value: myPlayer?.wins ?? 0, icon: Trophy, color: 'text-status-available' },
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

        {myMatches.length > 0 && (
          <div className="rounded-xl border border-border/50 bg-card p-5 elevation-1">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs font-display tracking-widest text-muted-foreground">MATCH HISTORY</span>
              <span className="ml-auto text-xs font-display text-muted-foreground">last {myMatches.length}</span>
            </div>
            <div className="space-y-2">
              {myMatches.map(m => {
                const won = m.winner?.includes(myPlayer!.id) ?? false;
                const opponents = m.players
                  .filter(id => id !== myPlayer!.id)
                  .map(id => players.find(p => p.id === id)?.name ?? 'Unknown');
                const eloChange = m.eloChanges?.[myPlayer!.id];
                const date = m.endedAt
                  ? new Date(m.endedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : '';
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${won ? 'border-status-available/20 bg-status-available/5' : 'border-status-playing/20 bg-status-playing/5'}`}>
                    <span className={`text-xs font-display font-bold w-8 shrink-0 ${won ? 'text-status-available' : 'text-status-playing'}`}>
                      {won ? 'WIN' : 'LOSS'}
                    </span>
                    <span className="text-xs text-muted-foreground flex-1 truncate">vs {opponents.join(', ')}</span>
                    {eloChange !== undefined && (
                      <span className={`text-xs font-display font-bold shrink-0 ${eloChange >= 0 ? 'text-status-available' : 'text-status-playing'}`}>
                        {eloChange >= 0 ? '+' : ''}{eloChange}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground shrink-0">{date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

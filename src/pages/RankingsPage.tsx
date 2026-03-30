import { useApp } from '@/context/AppContext';
import { Trophy, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

function getEloRank(elo: number): { label: string; color: string; icon: string } {
  if (elo >= 2000) return { label: 'Grandmaster', color: 'text-purple-400', icon: '👑' };
  if (elo >= 1800) return { label: 'Master', color: 'text-yellow-400', icon: '🏆' };
  if (elo >= 1600) return { label: 'Expert', color: 'text-blue-400', icon: '💎' };
  if (elo >= 1400) return { label: 'Advanced', color: 'text-green-400', icon: '⭐' };
  if (elo >= 1200) return { label: 'Intermediate', color: 'text-cyan-400', icon: '🎯' };
  return { label: 'Beginner', color: 'text-gray-400', icon: '🌱' };
}

const podiumOrder = [1, 0, 2];
const medalColors = [
  'text-gray-400 border-gray-400/30 bg-gray-400/10',
  'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  'text-amber-600 border-amber-600/30 bg-amber-600/10',
];
const podiumHeights = ['h-20', 'h-32', 'h-16'];
const podiumLabels = ['2nd', '1st', '3rd'];

export default function RankingsPage() {
  const { players } = useApp();

  // Sort by ELO (primary), then wins, then win rate
  const ranked = [...players]
    .filter(p => p.gamesPlayed > 0)
    .sort((a, b) => {
      const aElo = a.elo ?? 1200;
      const bElo = b.elo ?? 1200;
      if (bElo !== aElo) return bElo - aElo;
      if (b.wins !== a.wins) return b.wins - a.wins;
      const aRate = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
      const bRate = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
      return bRate - aRate;
    });

  const top3 = ranked.slice(0, 3);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display tracking-widest text-gradient">Leaderboard</h1>
        <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">{ranked.length} ranked players · sorted by ELO</p>
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-24">
          <div className="h-20 w-20 rounded-full bg-secondary/60 flex items-center justify-center mx-auto mb-4 elevation-1">
            <Trophy className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground text-sm">No matches played yet. Start a match to see rankings!</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="flex items-end justify-center gap-3 mb-10 max-w-sm mx-auto">
            {podiumOrder.map((idx, visualPos) => {
              const p = top3[idx];
              if (!p) return <div key={visualPos} className="flex-1" />;
              const isFirst = idx === 0;
              const rank = getEloRank(p.elo ?? 1200);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: visualPos * 0.12 }}
                  className="flex-1 flex flex-col items-center"
                >
                  {isFirst && <Crown className="h-5 w-5 text-yellow-400 mb-1" />}
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 ${medalColors[idx]}`}>
                    <span className="font-display text-sm font-bold">{idx + 1}</span>
                  </div>
                  <span className="font-display text-xs tracking-wider text-center truncate w-full px-1 mb-0.5">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground mb-0.5">{p.wins}W · {p.losses}L</span>
                  <span className={`text-[10px] font-display mb-2 ${rank.color}`}>{rank.icon} {p.elo ?? 1200}</span>
                  <div className={`w-full ${podiumHeights[visualPos]} rounded-t-lg bg-secondary/60 border border-border/50 flex flex-col items-center justify-center gap-1 elevation-1`}>
                    <span className="text-[10px] font-display tracking-wider text-muted-foreground">{podiumLabels[visualPos]}</span>
                    <span className="text-xs font-display text-primary font-bold">{p.points}pts</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Full table */}
          <div className="rounded-xl border border-border/50 overflow-hidden elevation-1">
            <div className="grid grid-cols-[44px_1fr_70px_55px_55px_65px_55px] gap-2 px-4 py-3 bg-secondary/60 text-[11px] font-display tracking-widest text-muted-foreground border-b border-border/50">
              <span className="text-center">#</span>
              <span>Player</span>
              <span className="text-center">ELO</span>
              <span className="text-center">Wins</span>
              <span className="text-center">Loss</span>
              <span className="text-center">Matches</span>
              <span className="text-center">Win%</span>
            </div>
            {ranked.map((p, i) => {
              const winRate = p.gamesPlayed > 0 ? Math.round((p.wins / p.gamesPlayed) * 100) : 0;
              const rank = getEloRank(p.elo ?? 1200);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`grid grid-cols-[44px_1fr_70px_55px_55px_65px_55px] gap-2 px-4 py-3 items-center min-h-[52px] border-t border-border/30 hover:bg-accent/40 transition-colors ${
                    i % 2 === 0 ? 'bg-card' : 'bg-card/60'
                  }`}
                >
                  <span className={`text-center font-display font-bold text-sm ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'
                  }`}>{i + 1}</span>
                  <div className="min-w-0">
                    <span className="font-medium text-sm truncate block">{p.name}</span>
                    <span className={`text-[10px] font-display ${rank.color}`}>{rank.icon} {rank.label}</span>
                  </div>
                  <span className={`text-center text-sm font-display font-bold ${rank.color}`}>{p.elo ?? 1200}</span>
                  <span className="text-center text-sm text-status-available font-semibold">{p.wins}</span>
                  <span className="text-center text-sm text-status-playing">{p.losses}</span>
                  <span className="text-center text-sm text-muted-foreground">{p.gamesPlayed}</span>
                  <span className={`text-center text-sm font-display font-bold ${winRate >= 60 ? 'text-status-available' : winRate >= 40 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {winRate}%
                  </span>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

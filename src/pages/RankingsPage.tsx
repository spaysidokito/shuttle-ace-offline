import { useApp } from '@/context/AppContext';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RankingsPage() {
  const { players } = useApp();

  const ranked = [...players]
    .filter(p => p.gamesPlayed > 0)
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const aRate = a.gamesPlayed > 0 ? a.wins / a.gamesPlayed : 0;
      const bRate = b.gamesPlayed > 0 ? b.wins / b.gamesPlayed : 0;
      if (bRate !== aRate) return bRate - aRate;
      return b.gamesPlayed - a.gamesPlayed;
    });

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">{ranked.length} ranked players</p>
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No matches played yet. Start a match to see rankings!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-xl mx-auto">
            {[1, 0, 2].map((idx) => {
              const p = top3[idx];
              if (!p) return <div key={idx} />;
              const colors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];
              const heights = ['h-32', 'h-24', 'h-20'];
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <Medal className={`h-6 w-6 ${colors[idx]} mb-2`} />
                  <span className="font-display text-sm tracking-wider text-center truncate max-w-full">{p.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">{p.wins}W / {p.losses}L</span>
                  <div className={`w-full ${heights[idx]} bg-secondary/50 rounded-t-md mt-2 flex items-center justify-center border border-border`}>
                    <span className="text-xs text-muted-foreground">{p.gamesPlayed} matches</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Full table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[50px_1fr_70px_70px_80px_70px] gap-2 px-4 py-3 bg-secondary/50 text-xs font-display tracking-wider text-muted-foreground">
              <span className="text-center">#</span>
              <span>Player</span>
              <span className="text-center">Wins</span>
              <span className="text-center">Losses</span>
              <span className="text-center">Matches</span>
              <span className="text-center">Win%</span>
            </div>
            {ranked.map((p, i) => {
              const winRate = p.gamesPlayed > 0 ? Math.round((p.wins / p.gamesPlayed) * 100) : 0;
              return (
                <div key={p.id} className={`grid grid-cols-[50px_1fr_70px_70px_80px_70px_80px] gap-2 px-4 py-3 items-center min-h-[52px] ${i % 2 === 0 ? 'bg-card' : 'bg-card/50'} border-t border-border`}>
                  <span className="text-center font-display font-bold text-muted-foreground">{i + 1}</span>
                  <span className="font-medium text-sm truncate">{p.name}</span>
                  <span className="text-center text-sm text-status-available font-semibold">{p.wins}</span>
                  <span className="text-center text-sm text-status-playing">{p.losses}</span>
                  <span className="text-center text-sm text-muted-foreground">{p.gamesPlayed}</span>
                  <span className="text-center text-sm">{winRate}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

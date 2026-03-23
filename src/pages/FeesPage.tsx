import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { DollarSign, Download, CheckCircle, AlertCircle } from 'lucide-react';

export default function FeesPage() {
  const { players, settings, matches, updatePlayer } = useApp();

  const playersWithFees = players.filter(p => p.feeOwed > 0 || p.feePaid > 0);
  const totalMatches = matches.length;
  const totalOwed = players.reduce((sum, p) => sum + p.feeOwed, 0);
  const totalPaid = players.reduce((sum, p) => sum + p.feePaid, 0);
  const outstanding = totalOwed - totalPaid;
  const outstandingPerMatch = totalMatches > 0 ? outstanding / totalMatches : 0;

  const markPaid = async (p: typeof players[0]) => {
    await updatePlayer({ ...p, feePaid: p.feeOwed });
  };

  const exportCSV = () => {
    const header = 'Name,Fee Owed,Fee Paid,Outstanding\n';
    const rows = playersWithFees.map(p =>
      `"${p.name}",${p.feeOwed},${p.feePaid},${p.feeOwed - p.feePaid}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display tracking-widest text-gradient">Fee Management</h1>
          <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">Track and manage player fees</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="h-10 font-display tracking-widest text-xs border-border/60 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border/50 bg-card p-5 elevation-2 hover:elevation-3 transition-all">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-display tracking-widest mb-3">
            <DollarSign className="h-3.5 w-3.5" /> TOTAL OWED
          </div>
          <span className="font-display text-3xl font-bold">{settings.currency}{totalOwed.toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-status-available/20 bg-card p-5 elevation-2 hover:elevation-3 transition-all">
          <div className="flex items-center gap-2 text-status-available text-[11px] font-display tracking-widest mb-3">
            <CheckCircle className="h-3.5 w-3.5" /> COLLECTED
          </div>
          <span className="font-display text-3xl font-bold text-status-available">{settings.currency}{totalPaid.toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-status-waiting/20 bg-card p-5 elevation-2 hover:elevation-3 transition-all">
          <div className="flex items-center gap-2 text-status-waiting text-[11px] font-display tracking-widest mb-3">
            <AlertCircle className="h-3.5 w-3.5" /> OUTSTANDING
          </div>
          <span className="font-display text-3xl font-bold text-status-waiting">{settings.currency}{outstanding.toLocaleString()}</span>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5 elevation-2 hover:elevation-3 transition-all">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-display tracking-widest mb-3">
            <DollarSign className="h-3.5 w-3.5" /> PER MATCH
          </div>
          <span className="font-display text-3xl font-bold">{settings.currency}{outstandingPerMatch.toFixed(2)}</span>
          <p className="text-[10px] text-muted-foreground mt-1">{totalMatches || 0} matches</p>
        </div>
      </div>

      {/* Fee config info */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs text-muted-foreground font-body">
        <span>Singles Shuttle: <strong className="text-foreground">{settings.currency}{settings.singlesShuttleFee}</strong></span>
        <span>Doubles Shuttle: <strong className="text-foreground">{settings.currency}{settings.doublesShuttleFee}</strong></span>
        <span>Court Fee/Match: <strong className="text-foreground">{settings.currency}{settings.courtFeePerPlayer}</strong></span>
        <span>Shuttle fee active: <strong className="text-foreground">{settings.includeShuttleFee ? 'Yes' : 'No'}</strong></span>
      </div>

      {/* Player fees table */}
      <div className="rounded-xl border border-border/50 overflow-hidden elevation-1">
        <div className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-2 px-4 py-3 bg-secondary/60 text-[11px] font-display tracking-widest text-muted-foreground border-b border-border/50">
          <span>Player</span>
          <span className="text-center">Owed</span>
          <span className="text-center">Paid</span>
          <span className="text-center">Balance</span>
          <span className="text-center">Action</span>
        </div>
        {playersWithFees.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground text-sm">No fees recorded yet</div>
        ) : (
          playersWithFees.map((p, i) => {
            const balance = p.feeOwed - p.feePaid;
            return (
              <div key={p.id} className={`grid grid-cols-[1fr_100px_100px_100px_100px] gap-2 px-4 py-3 items-center min-h-[52px] border-t border-border/30 hover:bg-accent/40 transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-card/60'}`}>
                <span className="font-medium text-sm truncate">{p.name}</span>
                <span className="text-center text-sm">{settings.currency}{p.feeOwed}</span>
                <span className="text-center text-sm text-status-available font-semibold">{settings.currency}{p.feePaid}</span>
                <span className={`text-center text-sm font-display font-bold ${balance > 0 ? 'text-status-waiting' : 'text-status-available'}`}>
                  {settings.currency}{balance}
                </span>
                <div className="flex justify-center">
                  {balance > 0 ? (
                    <Button size="sm" variant="outline" className="h-8 font-display tracking-widest text-[11px] border-border/50 hover:border-status-available/40 hover:text-status-available hover:bg-status-available/10 transition-all" onClick={() => markPaid(p)}>
                      Mark Paid
                    </Button>
                  ) : (
                    <CheckCircle className="h-5 w-5 text-status-available" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

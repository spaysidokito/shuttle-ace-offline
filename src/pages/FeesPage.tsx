import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { DollarSign, Download, CheckCircle, AlertCircle } from 'lucide-react';

export default function FeesPage() {
  const { players, settings, updatePlayer } = useApp();

  const playersWithFees = players.filter(p => p.feeOwed > 0 || p.feePaid > 0);
  const totalPlayers = players.length;
  const totalOwed = players.reduce((sum, p) => sum + p.feeOwed, 0);
  const totalPaid = players.reduce((sum, p) => sum + p.feePaid, 0);
  const outstanding = totalOwed - totalPaid;
  const outstandingPerPlayer = totalPlayers > 0 ? outstanding / totalPlayers : 0;

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
          <h1 className="text-2xl md:text-3xl font-bold">Fee Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage player fees</p>
        </div>
        <Button variant="secondary" onClick={exportCSV} className="h-11 font-display tracking-wider">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-display tracking-wider mb-2">
            <DollarSign className="h-4 w-4" /> TOTAL OWED
          </div>
          <span className="font-display text-3xl font-bold">{settings.currency}{totalOwed.toLocaleString()}</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-status-available text-xs font-display tracking-wider mb-2">
            <CheckCircle className="h-4 w-4" /> COLLECTED
          </div>
          <span className="font-display text-3xl font-bold text-status-available">{settings.currency}{totalPaid.toLocaleString()}</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-status-waiting text-xs font-display tracking-wider mb-2">
            <AlertCircle className="h-4 w-4" /> OUTSTANDING
          </div>
          <span className="font-display text-3xl font-bold text-status-waiting">{settings.currency}{outstanding.toLocaleString()}</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-status-waiting text-xs font-display tracking-wider mb-2">
            <DollarSign className="h-4 w-4" /> OUTSTANDING/PLAYER
          </div>
          <span className="font-display text-3xl font-bold text-status-waiting">{settings.currency}{outstandingPerPlayer.toFixed(2)}</span>
          <p className="text-xs text-muted-foreground mt-1">{totalPlayers || 0} players used for split</p>
        </div>
      </div>

      {/* Fee config info */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
        <span>Singles Shuttle: <strong className="text-foreground">{settings.currency}{settings.singlesShuttleFee}</strong></span>
        <span>Doubles Shuttle: <strong className="text-foreground">{settings.currency}{settings.doublesShuttleFee}</strong></span>
        <span>Court Fee/Player: <strong className="text-foreground">{settings.currency}{settings.courtFeePerPlayer}</strong></span>
      </div>

      {/* Player fees table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-2 px-4 py-3 bg-secondary/50 text-xs font-display tracking-wider text-muted-foreground">
          <span>Player</span>
          <span className="text-center">Owed</span>
          <span className="text-center">Paid</span>
          <span className="text-center">Balance</span>
          <span className="text-center">Action</span>
        </div>
        {playersWithFees.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No fees recorded yet</div>
        ) : (
          playersWithFees.map((p, i) => {
            const balance = p.feeOwed - p.feePaid;
            return (
              <div key={p.id} className={`grid grid-cols-[1fr_100px_100px_100px_100px] gap-2 px-4 py-3 items-center min-h-[52px] ${i % 2 === 0 ? 'bg-card' : 'bg-card/50'} border-t border-border`}>
                <span className="font-medium text-sm truncate">{p.name}</span>
                <span className="text-center text-sm">{settings.currency}{p.feeOwed}</span>
                <span className="text-center text-sm text-status-available">{settings.currency}{p.feePaid}</span>
                <span className={`text-center text-sm font-semibold ${balance > 0 ? 'text-status-waiting' : 'text-status-available'}`}>
                  {settings.currency}{balance}
                </span>
                <div className="flex justify-center">
                  {balance > 0 ? (
                    <Button size="sm" variant="secondary" className="h-9 font-display tracking-wider text-xs" onClick={() => markPaid(p)}>
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

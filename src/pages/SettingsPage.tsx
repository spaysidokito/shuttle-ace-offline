import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings, resetAll } = useApp();
  const [form, setForm] = useState(settings);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(form);
    toast.success('Settings saved!');
  };

  const handleReset = async () => {
    try {
      await resetAll();
      setShowReset(false);
      toast.success('All data has been reset.');
      // Navigate to root after reset so we don't stay on /settings where refresh of this URL may be absent in static hosting.
      navigate('/');
    } catch (err) {
      toast.error('Reset failed. Please try again.');
      console.error('resetAll error', err);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display tracking-widest text-gradient">Settings</h1>
        <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">Configure your court management system</p>
      </div>

      <div className="space-y-6">
        {/* Match Type */}
        <div className="rounded-xl border border-border/50 bg-card p-5 elevation-1">
          <label className="text-xs font-display tracking-widest text-muted-foreground mb-3 block">Default Match Type</label>
          <Select value={form.matchTypeDefault} onValueChange={v => setForm({ ...form, matchTypeDefault: v as 'singles' | 'doubles' })}>
            <SelectTrigger className="h-11 bg-secondary/40 border-border/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="singles">Singles</SelectItem>
              <SelectItem value="doubles">Doubles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Number of Courts */}
        <div className="rounded-xl border border-border/50 bg-card p-5 elevation-1">
          <label className="text-xs font-display tracking-widest text-muted-foreground mb-3 block">Number of Courts</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={form.numberOfCourts}
            onChange={e => setForm({ ...form, numberOfCourts: Number(e.target.value) })}
            className="h-11 bg-secondary/40 border-border/50"
          />
        </div>

        {/* Fee Settings */}
        <div className="rounded-xl border border-border/50 bg-card p-5 elevation-1">
          <h2 className="font-display text-sm tracking-widest text-muted-foreground mb-4">Fee Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Singles Shuttle Fee ({form.currency})</label>
              <Input type="number" min={0} value={form.singlesShuttleFee} onChange={e => setForm({ ...form, singlesShuttleFee: Number(e.target.value) })} className="h-11 bg-secondary/40 border-border/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Doubles Shuttle Fee ({form.currency})</label>
              <Input type="number" min={0} value={form.doublesShuttleFee} onChange={e => setForm({ ...form, doublesShuttleFee: Number(e.target.value) })} className="h-11 bg-secondary/40 border-border/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Court Fee (total per match) ({form.currency})</label>
              <Input type="number" min={0} value={form.courtFeePerPlayer} onChange={e => setForm({ ...form, courtFeePerPlayer: Number(e.target.value) })} className="h-11 bg-secondary/40 border-border/50" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 py-1">
              <Switch checked={form.includeShuttleFee} onCheckedChange={checked => setForm({ ...form, includeShuttleFee: checked })} />
              <span className="text-sm text-muted-foreground">Include shuttle fee in billing</span>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Currency Symbol</label>
              <Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="h-11 bg-secondary/40 border-border/50" />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full h-12 font-display tracking-widest text-sm elevation-1 hover:elevation-2 transition-all">
          Save Settings
        </Button>

        {/* Danger Zone */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 mt-4">
          <h2 className="font-display text-sm tracking-widest text-destructive mb-2">Danger Zone</h2>
          <p className="text-xs text-muted-foreground mb-4">This will permanently delete all players, matches, and fee data.</p>
          <Button variant="destructive" onClick={() => setShowReset(true)} className="h-10 font-display tracking-widest text-xs">
            <AlertTriangle className="mr-2 h-4 w-4" /> Reset All Data
          </Button>
        </div>
      </div>

      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider text-destructive">Confirm Reset</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowReset(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset} className="font-display tracking-wider">Yes, Reset Everything</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

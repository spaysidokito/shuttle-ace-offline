import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const result = mode === 'login'
      ? await login(name, pin || null)
      : await register(name, pin || null);
    setLoading(false);
    if (!result.ok) toast.error(result.error);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4"
      style={{ backgroundImage: 'radial-gradient(ellipse at 20% 0%, hsl(4 90% 58% / 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, hsl(220 80% 50% / 0.06) 0%, transparent 50%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl" />
            <div className="relative bg-primary/20 border border-primary/40 rounded-2xl p-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-3xl tracking-widest text-gradient">RallyQ</h1>
          <p className="text-xs text-muted-foreground tracking-widest mt-1">COURT MANAGER</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 elevation-3">
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-secondary/60 p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-display tracking-widest transition-all ${
                  mode === m ? 'bg-primary text-white elevation-1' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'login' ? 'LOGIN' : 'REGISTER'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-display tracking-widest text-muted-foreground mb-2 block">
                {mode === 'login' ? 'YOUR NAME' : 'CHOOSE A NAME'}
              </label>
              <Input
                placeholder="e.g. John"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-11 bg-secondary/40 border-border/50 focus:border-primary/50"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-display tracking-widest text-muted-foreground mb-2 block">
                PIN <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <div className="relative">
                <Input
                  type={showPin ? 'text' : 'password'}
                  placeholder="4-digit PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  maxLength={4}
                  className="h-11 bg-secondary/40 border-border/50 focus:border-primary/50 pr-10"
                />
                <button type="button" onClick={() => setShowPin(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading || !name.trim()} className="w-full h-11 font-display tracking-widest text-sm elevation-1 mt-2">
              {mode === 'login'
                ? <><LogIn className="mr-2 h-4 w-4" /> Login</>
                : <><UserPlus className="mr-2 h-4 w-4" /> Register</>
              }
            </Button>
          </form>

          {/* Admin hint */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Admin? Login with name <span className="text-primary font-display">Admin</span>
          </p>
        </div>
      </div>
    </div>
  );
}

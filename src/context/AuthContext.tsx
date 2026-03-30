import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Account } from '@/lib/db';
import { getAccount, getAccountByName, createAccount, updateAccount, ensureAdminAccount } from '@/lib/supabaseStore';

const SESSION_KEY = 'rallyq_session';

interface AuthContextType {
  account: Account | null;
  loading: boolean;
  login: (name: string, pin: string | null) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, pin: string | null) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isPlayer: boolean;
  linkedPlayerId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureAdminAccount();
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const acc = await getAccount(saved);
        if (acc) setAccount(acc);
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (name: string, pin: string | null): Promise<{ ok: boolean; error?: string }> => {
    const acc = await getAccountByName(name.trim());
    if (!acc) return { ok: false, error: 'Account not found. Please register first.' };
    if (acc.pin && acc.pin !== (pin || '')) return { ok: false, error: 'Incorrect PIN.' };
    setAccount(acc);
    localStorage.setItem(SESSION_KEY, acc.id);
    return { ok: true };
  }, []);

  const register = useCallback(async (name: string, pin: string | null): Promise<{ ok: boolean; error?: string }> => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: 'Name is required.' };
    const existing = await getAccountByName(trimmed);
    if (existing) return { ok: false, error: 'Name already taken.' };
    const acc = await createAccount(trimmed, pin || null, 'player');
    setAccount(acc);
    localStorage.setItem(SESSION_KEY, acc.id);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setAccount(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const value: AuthContextType = {
    account,
    loading,
    login,
    register,
    logout,
    isAdmin: account?.role === 'admin',
    isPlayer: account?.role === 'player',
    linkedPlayerId: account?.playerId ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

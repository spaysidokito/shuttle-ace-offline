import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAllPlayers, addPlayer as dbAddPlayer, updatePlayer as dbUpdatePlayer,
  deletePlayer as dbDeletePlayer, getAllCourts, initializeCourts,
  updateCourt as dbUpdateCourt, deleteCourt as dbDeleteCourt,
  getAllMatches, startMatch as dbStartMatch, endMatch as dbEndMatch,
  getActiveMatch, getSettings, updateSettings as dbUpdateSettings,
  getQueue, addToQueue as dbAddToQueue, removeFromQueue as dbRemoveFromQueue,
  getNextPlayers, resetAllData,
  getAllSessions, createSession as dbCreateSession, closeSession as dbCloseSession, joinSession as dbJoinSession,
} from '@/lib/supabaseStore';
import { type Player, type Court, type Match, type Settings, type GameSession, DEFAULT_SETTINGS, generateId } from '@/lib/db';

interface AppContextType {
  players: Player[];
  courts: Court[];
  matches: Match[];
  settings: Settings;
  queue: { id: string; playerId: string; addedAt: number }[];
  sessions: GameSession[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  addPlayer: (name: string, accountId?: string | null) => Promise<void>;
  updatePlayer: (player: Player) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  updateCourt: (court: Court) => Promise<void>;
  deleteCourt: (id: string) => Promise<void>;
  addCourt: () => Promise<void>;
  startMatch: (courtId: string, playerIds: string[], matchType: 'singles' | 'doubles') => Promise<void>;
  endMatch: (matchId: string, winnerIds: string[]) => Promise<void>;
  getActiveMatchForCourt: (courtId: string) => Promise<Match | undefined>;
  updateSettings: (s: Settings) => Promise<void>;
  getNextPlayersForMatch: (matchType: 'singles' | 'doubles') => Promise<Player[]>;
  addPlayerToQueue: (playerId: string) => Promise<void>;
  removePlayerFromQueue: (playerId: string) => Promise<void>;
  resetAll: () => Promise<void>;
  createSession: (name: string) => Promise<GameSession>;
  closeSession: (id: string) => Promise<void>;
  joinSession: (code: string, playerId: string) => Promise<GameSession | { error: string } | null>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [queue, setQueue] = useState<{ id: string; playerId: string; addedAt: number }[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    const [p, c, m, s, q, sess] = await Promise.all([
      getAllPlayers(), getAllCourts(), getAllMatches(), getSettings(), getQueue(), getAllSessions(),
    ]);
    setPlayers(p);
    setCourts(c);
    setMatches(m);
    setSettings(s);
    setQueue(q);
    setSessions(sess);
  }, []);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
      await initializeCourts(s.numberOfCourts);
      await refreshAll();
      setLoading(false);
    })();
  }, [refreshAll]);

  const value: AppContextType = {
    players, courts, matches, settings, queue, sessions, loading, refreshAll,
    addPlayer: async (name, accountId = null) => { await dbAddPlayer(name, accountId); await refreshAll(); },
    updatePlayer: async (p) => { await dbUpdatePlayer(p); await refreshAll(); },
    deletePlayer: async (id) => { await dbDeletePlayer(id); await refreshAll(); },
    updateCourt: async (c) => { await dbUpdateCourt(c); await refreshAll(); },
    deleteCourt: async (id) => { await dbDeleteCourt(id); await refreshAll(); },
    addCourt: async () => {
      const existing = await getAllCourts();
      await dbUpdateCourt({ id: generateId(), name: `Court ${existing.length + 1}`, status: 'available', players: [], matchType: settings.matchTypeDefault });
      await refreshAll();
    },
    startMatch: async (courtId, playerIds, matchType) => { await dbStartMatch(courtId, playerIds, matchType); await refreshAll(); },
    endMatch: async (matchId, winnerIds) => { await dbEndMatch(matchId, winnerIds); await refreshAll(); },
    getActiveMatchForCourt: getActiveMatch,
    updateSettings: async (s) => { await dbUpdateSettings(s); setSettings(s); await initializeCourts(s.numberOfCourts); await refreshAll(); },
    getNextPlayersForMatch: getNextPlayers,
    addPlayerToQueue: async (pid) => { await dbAddToQueue(pid); await refreshAll(); },
    removePlayerFromQueue: async (pid) => { await dbRemoveFromQueue(pid); await refreshAll(); },
    resetAll: async () => { await resetAllData(); await initializeCourts(DEFAULT_SETTINGS.numberOfCourts); await refreshAll(); },
    createSession: async (name) => { const s = await dbCreateSession(name); await refreshAll(); return s; },
    closeSession: async (id) => { await dbCloseSession(id); await refreshAll(); },
    joinSession: async (code, playerId) => { const s = await dbJoinSession(code, playerId); await refreshAll(); return s; },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

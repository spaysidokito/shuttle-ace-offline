import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ── Existing types (extended) ──
export interface Player {
  id: string;
  name: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  feePaid: number;
  feeOwed: number;
  // New fields
  winStreak: number;
  lastPlayed: number | null;
  achievements: string[];   // achievement IDs
  accountId: string | null; // linked account
}

export interface Court {
  id: string;
  name: string;
  status: 'available' | 'playing' | 'waiting';
  players: string[];
  matchType: 'singles' | 'doubles';
  sessionFeeApplied?: boolean;
}

export interface Match {
  id: string;
  courtId: string;
  players: string[];
  matchType: 'singles' | 'doubles';
  winner: string[] | null;
  startedAt: number;
  endedAt: number | null;
  sessionId: string | null;
}

export interface Settings {
  id: string;
  matchTypeDefault: 'singles' | 'doubles';
  numberOfCourts: number;
  singlesShuttleFee: number;
  doublesShuttleFee: number;
  courtFeePerPlayer: number;
  includeShuttleFee: boolean;
  currency: string;
}

// ── New types ──
export interface Account {
  id: string;
  name: string;
  pin: string | null;   // hashed or plain (lightweight)
  playerId: string | null;
  role: 'admin' | 'player';
  createdAt: number;
}

export interface GameSession {
  id: string;
  joinCode: string;       // e.g. RQ-4821
  name: string;
  status: 'active' | 'closed';
  createdAt: number;
  closedAt: number | null;
  playerIds: string[];    // players who joined via this session
}

export interface Achievement {
  id: string;
  key: string;
  label: string;
  description: string;
  icon: string;           // emoji
}

// ── DB Schema ──
interface BadmintonDB extends DBSchema {
  players: {
    key: string;
    value: Player;
    indexes: { 'by-status': string; 'by-name': string };
  };
  courts: {
    key: string;
    value: Court;
  };
  matches: {
    key: string;
    value: Match;
    indexes: { 'by-court': string; 'by-session': string };
  };
  settings: {
    key: string;
    value: Settings;
  };
  queue: {
    key: string;
    value: { id: string; playerId: string; addedAt: number };
    indexes: { 'by-time': number };
  };
  accounts: {
    key: string;
    value: Account;
    indexes: { 'by-name': string };
  };
  sessions: {
    key: string;
    value: GameSession;
    indexes: { 'by-code': string; 'by-status': string };
  };
}

let dbPromise: Promise<IDBPDatabase<BadmintonDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<BadmintonDB>('badminton-manager', 3, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('players')) {
          const ps = db.createObjectStore('players', { keyPath: 'id' });
          ps.createIndex('by-status', 'status');
          ps.createIndex('by-name', 'name');
        }
        if (!db.objectStoreNames.contains('courts')) {
          db.createObjectStore('courts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('matches')) {
          const ms = db.createObjectStore('matches', { keyPath: 'id' });
          ms.createIndex('by-court', 'courtId');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('queue')) {
          const qs = db.createObjectStore('queue', { keyPath: 'id' });
          qs.createIndex('by-time', 'addedAt');
        }
        if (!db.objectStoreNames.contains('accounts')) {
          const as = db.createObjectStore('accounts', { keyPath: 'id' });
          as.createIndex('by-name', 'name');
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const ss = db.createObjectStore('sessions', { keyPath: 'id' });
          ss.createIndex('by-code', 'joinCode');
          ss.createIndex('by-status', 'status');
        }
      },
      blocked() {
        // Another tab has an older version open — reset so we retry
        dbPromise = null;
      },
      blocking() {
        // This tab is blocking an upgrade in another tab — close so it can proceed
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

export function generateId() {
  return crypto.randomUUID();
}

export function generateJoinCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `RQ-${num}`;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'default',
  matchTypeDefault: 'doubles',
  numberOfCourts: 3,
  singlesShuttleFee: 60,
  doublesShuttleFee: 30,
  courtFeePerPlayer: 120,
  includeShuttleFee: true,
  currency: '₱',
};

// ── Achievement definitions ──
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win',      key: 'first_win',      label: 'First Blood',     description: 'Win your first match',           icon: '🏆' },
  { id: 'streak_3',       key: 'streak_3',        label: 'On Fire',         description: '3 wins in a row',                icon: '🔥' },
  { id: 'streak_5',       key: 'streak_5',        label: 'Unstoppable',     description: '5 wins in a row',                icon: '⚡' },
  { id: 'played_5',       key: 'played_5',        label: 'Regular',         description: 'Play 5 matches',                 icon: '🎯' },
  { id: 'played_10',      key: 'played_10',       label: 'Veteran',         description: 'Play 10 matches',                icon: '🎖️' },
  { id: 'played_25',      key: 'played_25',       label: 'Legend',          description: 'Play 25 matches',                icon: '👑' },
  { id: 'high_win_rate',  key: 'high_win_rate',   label: 'Sharp Shooter',   description: 'Win rate above 70% (min 5 games)', icon: '🎯' },
  { id: 'comeback_win',   key: 'comeback_win',    label: 'Comeback Kid',    description: 'Win after a loss',               icon: '💪' },
  { id: 'social',         key: 'social',          label: 'Team Player',     description: 'Play with 5 different partners', icon: '🤝' },
];

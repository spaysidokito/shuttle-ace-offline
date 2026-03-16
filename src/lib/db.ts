import { openDB, DBSchema, IDBPDatabase } from 'idb';

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
}

export interface Court {
  id: string;
  name: string;
  status: 'available' | 'playing' | 'waiting';
  players: string[]; // player IDs
  matchType: 'singles' | 'doubles';
  sessionFeeApplied?: boolean;
}

export interface Match {
  id: string;
  courtId: string;
  players: string[];
  matchType: 'singles' | 'doubles';
  winner: string[] | null; // winning player IDs
  startedAt: number;
  endedAt: number | null;
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
    indexes: { 'by-court': string };
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
}

let dbPromise: Promise<IDBPDatabase<BadmintonDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<BadmintonDB>('badminton-manager', 1, {
      upgrade(db) {
        const playerStore = db.createObjectStore('players', { keyPath: 'id' });
        playerStore.createIndex('by-status', 'status');
        playerStore.createIndex('by-name', 'name');

        db.createObjectStore('courts', { keyPath: 'id' });

        const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
        matchStore.createIndex('by-court', 'courtId');

        db.createObjectStore('settings', { keyPath: 'id' });

        const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
        queueStore.createIndex('by-time', 'addedAt');
      },
    });
  }
  return dbPromise;
}

export function generateId() {
  return crypto.randomUUID();
}

// Default settings
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

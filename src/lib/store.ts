import { getDB, generateId, DEFAULT_SETTINGS, type Player, type Court, type Match, type Settings } from './db';

// ── Players ──
export async function getAllPlayers(): Promise<Player[]> {
  const db = await getDB();
  return db.getAll('players');
}

export async function addPlayer(name: string): Promise<Player> {
  const db = await getDB();
  const player: Player = {
    id: generateId(),
    name,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    points: 0,
    status: 'waiting',
    createdAt: Date.now(),
    feePaid: 0,
    feeOwed: 0,
  };
  await db.put('players', player);
  // Also add to queue
  await addToQueue(player.id);
  return player;
}

export async function updatePlayer(player: Player): Promise<void> {
  const db = await getDB();
  await db.put('players', player);
}

export async function deletePlayer(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('players', id);
  // Remove from queue
  const queue = await getQueue();
  const entry = queue.find(q => q.playerId === id);
  if (entry) await db.delete('queue', entry.id);
}

export async function getPlayer(id: string): Promise<Player | undefined> {
  const db = await getDB();
  return db.get('players', id);
}

// ── Queue ──
export async function getQueue() {
  const db = await getDB();
  const all = await db.getAllFromIndex('queue', 'by-time');
  return all;
}

export async function addToQueue(playerId: string) {
  const db = await getDB();
  // Check not already in queue
  const existing = await getQueue();
  if (existing.some(q => q.playerId === playerId)) return;
  await db.put('queue', { id: generateId(), playerId, addedAt: Date.now() });
}

export async function removeFromQueue(playerId: string) {
  const db = await getDB();
  const queue = await getQueue();
  const entry = queue.find(q => q.playerId === playerId);
  if (entry) await db.delete('queue', entry.id);
}

// ── Courts ──
export async function getAllCourts(): Promise<Court[]> {
  const db = await getDB();
  return db.getAll('courts');
}

export async function initializeCourts(count: number) {
  const db = await getDB();
  const existing = await db.getAll('courts');
  // Add courts if needed
  for (let i = existing.length + 1; i <= count; i++) {
    const court: Court = {
      id: generateId(),
      name: `Court ${i}`,
      status: 'available',
      players: [],
      matchType: 'doubles',
    };
    await db.put('courts', court);
  }
  // Remove extra courts
  if (existing.length > count) {
    const sorted = existing.sort((a, b) => a.name.localeCompare(b.name));
    for (let i = count; i < sorted.length; i++) {
      await db.delete('courts', sorted[i].id);
    }
  }
}

export async function updateCourt(court: Court): Promise<void> {
  const db = await getDB();
  await db.put('courts', court);
}

export async function deleteCourt(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('courts', id);
}

// ── Matches ──
export async function getAllMatches(): Promise<Match[]> {
  const db = await getDB();
  return db.getAll('matches');
}

export async function startMatch(courtId: string, playerIds: string[], matchType: 'singles' | 'doubles'): Promise<Match> {
  const db = await getDB();
  const match: Match = {
    id: generateId(),
    courtId,
    players: playerIds,
    matchType,
    winner: null,
    startedAt: Date.now(),
    endedAt: null,
  };
  await db.put('matches', match);

  // Update court
  const court = await db.get('courts', courtId);
  if (court) {
    court.status = 'playing';
    court.players = playerIds;
    court.matchType = matchType;
    await db.put('courts', court);
  }

  // Update player statuses
  for (const pid of playerIds) {
    const p = await db.get('players', pid);
    if (p) {
      p.status = 'playing';
      await db.put('players', p);
    }
    await removeFromQueue(pid);
  }

  return match;
}

export async function endMatch(matchId: string, winnerIds: string[]): Promise<void> {
  const db = await getDB();
  const match = await db.get('matches', matchId);
  if (!match) return;

  match.winner = winnerIds;
  match.endedAt = Date.now();
  await db.put('matches', match);

  // Get settings for fee calc
  const settings = await getSettings();

  // Update players
  for (const pid of match.players) {
    const p = await db.get('players', pid);
    if (!p) continue;
    p.gamesPlayed += 1;
    const isWinner = winnerIds.includes(pid);
    if (isWinner) {
      p.wins += 1;
      p.points += 3;
    } else {
      p.losses += 1;
      p.points += 1;
    }
    p.status = 'waiting';
    // Fee
    const shuttleFee = match.matchType === 'singles' ? settings.singlesShuttleFee : settings.doublesShuttleFee;
    p.feeOwed += shuttleFee + settings.courtFeePerPlayer;
    await db.put('players', p);
    await addToQueue(pid);
  }

  // Reset court
  const court = await db.get('courts', match.courtId);
  if (court) {
    court.status = 'available';
    court.players = [];
    await db.put('courts', court);
  }
}

export async function getActiveMatch(courtId: string): Promise<Match | undefined> {
  const db = await getDB();
  const matches = await db.getAllFromIndex('matches', 'by-court', courtId);
  return matches.find(m => !m.endedAt);
}

// ── Settings ──
export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const s = await db.get('settings', 'default');
  if (!s) {
    await db.put('settings', DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return s;
}

export async function updateSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

// ── Smart Queue Logic ──
export async function getNextPlayers(matchType: 'singles' | 'doubles'): Promise<Player[]> {
  const queue = await getQueue();
  const count = matchType === 'singles' ? 2 : 4;
  const players: Player[] = [];

  for (const entry of queue) {
    if (players.length >= count) break;
    const p = await getPlayer(entry.playerId);
    if (p && p.status === 'waiting') {
      players.push(p);
    }
  }
  return players;
}

// ── Reset ──
export async function resetAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('players');
  await db.clear('courts');
  await db.clear('matches');
  await db.clear('queue');
  await db.clear('settings');
}

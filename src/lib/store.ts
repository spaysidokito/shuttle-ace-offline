import { getDB, resetDBCache, generateId, generateJoinCode, DEFAULT_SETTINGS, ACHIEVEMENTS, type Player, type Court, type Match, type Settings, type Account, type GameSession } from './db';

// ── Players ──
export async function getAllPlayers(): Promise<Player[]> {
  const db = await getDB();
  return db.getAll('players');
}

export async function addPlayer(name: string, accountId: string | null = null): Promise<Player> {
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
    winStreak: 0,
    lastPlayed: null,
    achievements: [],
    accountId,
  };
  await db.put('players', player);
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
  return db.getAllFromIndex('queue', 'by-time');
}

export async function addToQueue(playerId: string) {
  const db = await getDB();
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
  for (let i = existing.length + 1; i <= count; i++) {
    await db.put('courts', { id: generateId(), name: `Court ${i}`, status: 'available', players: [], matchType: 'doubles' });
  }
  if (existing.length > count) {
    const sorted = existing.sort((a, b) => a.name.localeCompare(b.name));
    for (let i = count; i < sorted.length; i++) await db.delete('courts', sorted[i].id);
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

export async function startMatch(courtId: string, playerIds: string[], matchType: 'singles' | 'doubles', sessionId: string | null = null): Promise<Match> {
  const db = await getDB();
  const settings = await getSettings();
  const courtFeeShare = Math.round((settings.courtFeePerPlayer / playerIds.length) * 100) / 100;

  const match: Match = {
    id: generateId(),
    courtId,
    players: playerIds,
    matchType,
    winner: null,
    startedAt: Date.now(),
    endedAt: null,
    sessionId,
  };
  await db.put('matches', match);

  const court = await db.get('courts', courtId);
  const shouldApplyCourtFee = court && !court.sessionFeeApplied;
  if (court) {
    court.status = 'playing';
    court.players = playerIds;
    court.matchType = matchType;
    if (shouldApplyCourtFee) court.sessionFeeApplied = true;
    await db.put('courts', court);
  }

  for (const pid of playerIds) {
    const p = await db.get('players', pid);
    if (p) {
      p.status = 'playing';
      if (shouldApplyCourtFee) p.feeOwed += courtFeeShare;
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

  const settings = await getSettings();

  for (const pid of match.players) {
    const p = await db.get('players', pid);
    if (!p) continue;
    const wasWinner = winnerIds.includes(pid);
    const prevStreak = p.winStreak ?? 0;
    const hadLoss = p.losses > 0;

    p.gamesPlayed += 1;
    p.lastPlayed = Date.now();
    if (wasWinner) {
      p.wins += 1;
      p.points += 3;
      p.winStreak = prevStreak + 1;
    } else {
      p.losses += 1;
      p.points += 1;
      p.winStreak = 0;
    }
    p.status = 'waiting';
    const shuttleFee = settings.includeShuttleFee
      ? (match.matchType === 'singles' ? settings.singlesShuttleFee : settings.doublesShuttleFee)
      : 0;
    p.feeOwed += shuttleFee;

    // Check achievements
    p.achievements = p.achievements ?? [];
    const earned = checkAchievements(p, wasWinner, hadLoss);
    for (const a of earned) {
      if (!p.achievements.includes(a)) p.achievements.push(a);
    }

    await db.put('players', p);
    await addToQueue(pid);
  }

  const court = await db.get('courts', match.courtId);
  if (court) {
    court.status = 'available';
    court.players = [];
    await db.put('courts', court);
  }
}

function checkAchievements(p: Player, isWinner: boolean, hadPriorLoss: boolean): string[] {
  const earned: string[] = [];
  if (isWinner && p.wins === 1) earned.push('first_win');
  if (isWinner && p.winStreak >= 3) earned.push('streak_3');
  if (isWinner && p.winStreak >= 5) earned.push('streak_5');
  if (p.gamesPlayed >= 5) earned.push('played_5');
  if (p.gamesPlayed >= 10) earned.push('played_10');
  if (p.gamesPlayed >= 25) earned.push('played_25');
  if (p.gamesPlayed >= 5 && p.wins / p.gamesPlayed >= 0.7) earned.push('high_win_rate');
  if (isWinner && hadPriorLoss && p.winStreak === 1) earned.push('comeback_win');
  return earned;
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
  if (!s) { await db.put('settings', DEFAULT_SETTINGS); return DEFAULT_SETTINGS; }
  return s;
}

export async function updateSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

// ── Smart Queue ──
export async function getNextPlayers(matchType: 'singles' | 'doubles'): Promise<Player[]> {
  const queue = await getQueue();
  const waitingPlayers = await Promise.all(queue.map(e => getPlayer(e.playerId)));
  const filtered = waitingPlayers.filter((p): p is Player => !!p && p.status === 'waiting');
  if (matchType === 'singles') return filtered.slice(0, 2);
  const sorted = filtered
    .map(p => ({ player: p, ratio: p.gamesPlayed > 0 ? p.wins / p.gamesPlayed : 0 }))
    .sort((a, b) => a.ratio - b.ratio || a.player.gamesPlayed - b.player.gamesPlayed);
  return sorted.slice(0, 4).map(i => i.player);
}

// ── Accounts ──
export async function getAllAccounts(): Promise<Account[]> {
  const db = await getDB();
  return db.getAll('accounts');
}

export async function getAccount(id: string): Promise<Account | undefined> {
  const db = await getDB();
  return db.get('accounts', id);
}

export async function getAccountByName(name: string): Promise<Account | undefined> {
  const db = await getDB();
  const all = await db.getAllFromIndex('accounts', 'by-name', name);
  return all[0];
}

export async function createAccount(name: string, pin: string | null, role: 'admin' | 'player'): Promise<Account> {
  const db = await getDB();
  const account: Account = {
    id: generateId(),
    name,
    pin: pin || null,
    playerId: null,
    role,
    createdAt: Date.now(),
  };
  await db.put('accounts', account);
  return account;
}

export async function updateAccount(account: Account): Promise<void> {
  const db = await getDB();
  await db.put('accounts', account);
}

export async function ensureAdminAccount(): Promise<void> {
  const db = await getDB();
  const all = await db.getAll('accounts');
  if (!all.find(a => a.role === 'admin')) {
    await db.put('accounts', {
      id: 'admin',
      name: 'Admin',
      pin: null,
      playerId: null,
      role: 'admin',
      createdAt: Date.now(),
    });
  }
}

// ── Game Sessions ──
export async function getAllSessions(): Promise<GameSession[]> {
  const db = await getDB();
  return db.getAll('sessions');
}

export async function getSession(id: string): Promise<GameSession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function getSessionByCode(code: string): Promise<GameSession | undefined> {
  const db = await getDB();
  const all = await db.getAll('sessions');
  return all.find(s => s.joinCode === code.toUpperCase() && s.status === 'active');
}

export async function createSession(name: string): Promise<GameSession> {
  const db = await getDB();
  // ensure unique code
  let code = generateJoinCode();
  let existing = await getSessionByCode(code);
  while (existing) { code = generateJoinCode(); existing = await getSessionByCode(code); }

  const session: GameSession = {
    id: generateId(),
    joinCode: code,
    name,
    status: 'active',
    createdAt: Date.now(),
    closedAt: null,
    playerIds: [],
  };
  await db.put('sessions', session);
  return session;
}

export async function closeSession(id: string): Promise<void> {
  const db = await getDB();
  const s = await db.get('sessions', id);
  if (!s) return;
  s.status = 'closed';
  s.closedAt = Date.now();
  await db.put('sessions', s);
}

export async function joinSession(code: string, playerId: string): Promise<GameSession | { error: string } | null> {
  // Force fresh DB connection so we see data written by other tabs
  resetDBCache();
  const db = await getDB();
  const all = await db.getAll('sessions');
  const normalized = code.toUpperCase();
  console.log('[DEBUG] joinSession - code:', normalized, '| all sessions:', all.map(s => ({ code: s.joinCode, status: s.status })));
  const match = all.find(s => s.joinCode === normalized);
  if (!match) return null;
  if (match.status !== 'active') return { error: 'This session has been closed.' };
  if (!match.playerIds.includes(playerId)) {
    match.playerIds.push(playerId);
    await db.put('sessions', match);
  }
  await addToQueue(playerId);
  return match;
}

// ── Reset ──
export async function resetAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('players');
  await db.clear('courts');
  await db.clear('matches');
  await db.clear('queue');
  await db.clear('settings');
  await db.clear('sessions');
  // keep accounts
}

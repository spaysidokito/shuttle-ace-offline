import { supabase } from './supabase';
import type { Player, Court, Match, Settings, Account, GameSession } from './db';

// Helper to convert snake_case DB rows to camelCase
function toCamelCase<T>(obj: any): T {
  if (!obj) return obj;
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function toSnakeCase(obj: any): any {
  if (!obj) return obj;
  const result: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

// ── Players ──
export async function getAllPlayers(): Promise<Player[]> {
  const { data, error } = await supabase.from('players').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => toCamelCase<Player>(row));
}

export async function addPlayer(name: string, accountId: string | null = null): Promise<Player> {
  const player = {
    name,
    games_played: 0,
    wins: 0,
    losses: 0,
    points: 0,
    status: 'waiting' as const,
    created_at: Date.now(),
    fee_paid: 0,
    fee_owed: 0,
    win_streak: 0,
    last_played: null,
    achievements: [],
    account_id: accountId,
    elo: 1200,
  };
  const { data, error } = await supabase.from('players').insert(player).select().single();
  if (error) throw error;
  await addToQueue(data.id);
  return toCamelCase(data);
}

export async function updatePlayer(player: Player): Promise<void> {
  const { error } = await supabase.from('players').update(toSnakeCase(player)).eq('id', player.id);
  if (error) throw error;
}

export async function deletePlayer(id: string): Promise<void> {
  await supabase.from('queue').delete().eq('player_id', id);
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw error;
}

export async function getPlayer(id: string): Promise<Player | undefined> {
  const { data, error } = await supabase.from('players').select('*').eq('id', id).single();
  if (error) return undefined;
  return toCamelCase(data);
}

// ── Queue ──
export async function getQueue() {
  const { data, error } = await supabase.from('queue').select('*').order('added_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(row => ({ id: row.id, playerId: row.player_id, addedAt: row.added_at }));
}

export async function addToQueue(playerId: string) {
  const existing = await getQueue();
  if (existing.some(q => q.playerId === playerId)) return;
  const { error } = await supabase.from('queue').insert({ player_id: playerId, added_at: Date.now() });
  if (error) throw error;
}

export async function removeFromQueue(playerId: string) {
  const { error } = await supabase.from('queue').delete().eq('player_id', playerId);
  if (error) throw error;
}

// ── Courts ──
export async function getAllCourts(): Promise<Court[]> {
  const { data, error } = await supabase.from('courts').select('*').order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    status: row.status as Court['status'],
    players: row.players || [],
    matchType: row.match_type as Court['matchType'],
    sessionFeeApplied: row.session_fee_applied,
  }));
}

export async function initializeCourts(count: number) {
  const existing = await getAllCourts();
  for (let i = existing.length + 1; i <= count; i++) {
    await supabase.from('courts').insert({ name: `Court ${i}`, status: 'available', players: [], match_type: 'doubles' });
  }
  if (existing.length > count) {
    const toDelete = existing.slice(count).map(c => c.id);
    await supabase.from('courts').delete().in('id', toDelete);
  }
}

export async function updateCourt(court: Court): Promise<void> {
  const { error } = await supabase.from('courts').upsert({
    id: court.id,
    name: court.name,
    status: court.status,
    players: court.players,
    match_type: court.matchType,
    session_fee_applied: court.sessionFeeApplied,
  });
  if (error) throw error;
}

export async function deleteCourt(id: string): Promise<void> {
  const { error } = await supabase.from('courts').delete().eq('id', id);
  if (error) throw error;
}

// ── Matches ──
export async function getAllMatches(): Promise<Match[]> {
  const { data, error } = await supabase.from('matches').select('*').order('started_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    courtId: row.court_id || '',
    players: row.players || [],
    matchType: row.match_type as Match['matchType'],
    winner: row.winner,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    sessionId: row.session_id,
    eloChanges: row.elo_changes || {},
  }));
}

export async function startMatch(courtId: string, playerIds: string[], matchType: 'singles' | 'doubles', sessionId: string | null = null): Promise<Match> {
  try {
    const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'default').single();
    const settings = settingsData ? {
      courtFeePerPlayer: settingsData.court_fee_per_player ?? 120,
      feeCalculationMode: (settingsData.fee_calculation_mode ?? 'per-game-split') as 'per-player' | 'per-game-split',
    } : { courtFeePerPlayer: 120, feeCalculationMode: 'per-game-split' as const };

    // Fee calculation based on mode
    let courtFeeShare = 0;
    if (settings.feeCalculationMode === 'per-player') {
      // Old way: fixed fee per player
      courtFeeShare = Math.round((settings.courtFeePerPlayer / playerIds.length) * 100) / 100;
    }
    // For per-game-split mode, we don't charge upfront - fees are calculated at session end

    const { data: matchData, error: matchError } = await supabase.from('matches').insert({
      court_id: courtId,
      players: playerIds,
      match_type: matchType,
      winner: null,
      started_at: Date.now(),
      ended_at: null,
      session_id: sessionId,
    }).select().single();
    if (matchError) throw matchError;
    if (!matchData) throw new Error('Failed to create match');

    const { data: court } = await supabase.from('courts').select('*').eq('id', courtId).single();
    const shouldApplyCourtFee = court && !court.session_fee_applied && settings.feeCalculationMode === 'per-player';

    if (court) {
      await supabase.from('courts').update({
        status: 'playing',
        players: playerIds,
        match_type: matchType,
        session_fee_applied: shouldApplyCourtFee ? true : court.session_fee_applied,
      }).eq('id', courtId);
    }

    for (const pid of playerIds) {
      const { data: player } = await supabase.from('players').select('*').eq('id', pid).single();
      if (player) {
        await supabase.from('players').update({
          status: 'playing',
          fee_owed: player.fee_owed + (shouldApplyCourtFee ? courtFeeShare : 0),
        }).eq('id', pid);
      }
      await removeFromQueue(pid);
    }

    return {
      id: matchData.id,
      courtId: matchData.court_id || '',
      players: matchData.players || [],
      matchType: matchData.match_type as Match['matchType'],
      winner: matchData.winner,
      startedAt: matchData.started_at,
      endedAt: matchData.ended_at,
      sessionId: matchData.session_id,
      eloChanges: matchData.elo_changes || {},
    };
  } catch (error) {
    console.error('Error starting match:', error);
    throw error;
  }
}

// ELO calculation (K-factor = 32 for active players)
function calculateEloChange(playerElo: number, opponentElo: number, won: boolean, kFactor = 32): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actualScore = won ? 1 : 0;
  return Math.round(kFactor * (actualScore - expectedScore));
}

export async function endMatch(matchId: string, winnerIds: string[]): Promise<void> {
  try {
    const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
    if (!match) {
      console.error('Match not found:', matchId);
      return;
    }

    const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'default').single();
    const settings = settingsData ? {
      includeShuttleFee: settingsData.include_shuttle_fee ?? true,
      singlesShuttleFee: settingsData.singles_shuttle_fee ?? 60,
      doublesShuttleFee: settingsData.doubles_shuttle_fee ?? 30,
      feeCalculationMode: (settingsData.fee_calculation_mode ?? 'per-game-split') as 'per-player' | 'per-game-split',
      totalCourtFee: settingsData.total_court_fee ?? 1400,
      totalShuttleFee: settingsData.total_shuttle_fee ?? 420,
    } : { 
      includeShuttleFee: true, 
      singlesShuttleFee: 60, 
      doublesShuttleFee: 30,
      feeCalculationMode: 'per-game-split' as const,
      totalCourtFee: 1400,
      totalShuttleFee: 420,
    };

    // Pre-fetch all player ELOs for underdog detection
    const playerIds: string[] = match.players || [];
    const { data: allPlayerData } = await supabase.from('players').select('*').in('id', playerIds);
    const playerMap: Record<string, any> = {};
    for (const p of allPlayerData || []) playerMap[p.id] = p;

    // Calculate all ELO changes first
    const eloChanges: Record<string, number> = {};
    for (const pid of playerIds) {
      const player = playerMap[pid];
      if (!player) continue;
      const wasWinner = winnerIds.includes(pid);
      const opponents = playerIds.filter(id => id !== pid);
      if (opponents.length > 0) {
        const opponentElos = opponents.map(id => playerMap[id]?.elo || 1200);
        const avgOpponentElo = opponentElos.reduce((sum, elo) => sum + elo, 0) / opponentElos.length;
        eloChanges[pid] = calculateEloChange(player.elo || 1200, avgOpponentElo, wasWinner);
      }
    }

    await supabase.from('matches').update({ winner: winnerIds, ended_at: Date.now(), elo_changes: eloChanges }).eq('id', matchId);

    // Calculate fees based on mode
    if (settings.feeCalculationMode === 'per-game-split') {
      // Get all players who have played at least one match
      const { data: allMatches } = await supabase.from('matches').select('players').not('ended_at', 'is', null);
      const uniquePlayers = new Set<string>();
      for (const m of allMatches || []) {
        for (const pid of m.players || []) {
          uniquePlayers.add(pid);
        }
      }
      const totalPlayers = uniquePlayers.size;
      if (totalPlayers > 0) {
        const totalFees = settings.totalCourtFee + (settings.includeShuttleFee ? settings.totalShuttleFee : 0);
        const feePerPlayer = Math.round((totalFees / totalPlayers) * 100) / 100;
        
        // Recalculate fees for ALL players who have played
        const { data: allPlayersWhoPlayed } = await supabase.from('players').select('*').in('id', Array.from(uniquePlayers));
        for (const p of allPlayersWhoPlayed || []) {
          await supabase.from('players').update({
            fee_owed: feePerPlayer
          }).eq('id', p.id);
        }
      }
    }

    for (const pid of playerIds) {
      const player = playerMap[pid];
      if (!player) continue;

      const wasWinner = winnerIds.includes(pid);
      const prevStreak = player.win_streak ?? 0;
      const prevLossStreak = player.loss_streak ?? 0;
      const hadLoss = player.losses > 0;

      let shuttleFee = 0;
      if (settings.feeCalculationMode === 'per-player') {
        // Old mode: charge shuttle fee per match
        shuttleFee = settings.includeShuttleFee
          ? (match.match_type === 'singles' ? settings.singlesShuttleFee : settings.doublesShuttleFee)
          : 0;
      }
      // Note: In per-game-split mode, fees are already set above for all players

      const eloChange = eloChanges[pid] ?? 0;

      // Underdog win: winner had lower ELO than all opponents
      const opponents = playerIds.filter(id => id !== pid);
      const opponentElos = opponents.map(id => playerMap[id]?.elo || 1200);
      const isUnderdogWin = wasWinner && opponentElos.every(elo => elo > (player.elo || 1200));

      const newAchievements = [...(player.achievements || [])];
      const earned = checkAchievements({
        gamesPlayed: player.games_played + 1,
        wins: player.wins + (wasWinner ? 1 : 0),
        losses: player.losses + (wasWinner ? 0 : 1),
        winStreak: wasWinner ? prevStreak + 1 : 0,
        lossStreak: wasWinner ? 0 : prevLossStreak + 1,
      }, wasWinner, hadLoss, isUnderdogWin);
      for (const a of earned) {
        if (!newAchievements.includes(a)) newAchievements.push(a);
      }

      const newLossStreak = wasWinner ? 0 : prevLossStreak + 1;

      const updateData: any = {
        games_played: player.games_played + 1,
        wins: player.wins + (wasWinner ? 1 : 0),
        losses: player.losses + (wasWinner ? 0 : 1),
        points: player.points + (wasWinner ? 3 : 1),
        status: 'waiting',
        win_streak: wasWinner ? prevStreak + 1 : 0,
        loss_streak: newLossStreak,
        last_played: Date.now(),
        achievements: newAchievements,
        elo: Math.max(100, (player.elo || 1200) + eloChange),
      };
      
      // Only add shuttleFee in per-player mode (per-game-split already set fee_owed above)
      if (settings.feeCalculationMode === 'per-player') {
        updateData.fee_owed = player.fee_owed + shuttleFee;
      }
      
      await supabase.from('players').update(updateData).eq('id', pid);

      await addToQueue(pid);
    }

    await supabase.from('courts').update({ status: 'available', players: [] }).eq('id', match.court_id);
  } catch (error) {
    console.error('Error ending match:', error);
    throw error;
  }
}

function checkAchievements(
  p: { gamesPlayed: number; wins: number; losses: number; winStreak: number; lossStreak: number },
  isWinner: boolean,
  hadPriorLoss: boolean,
  isUnderdogWin: boolean,
): string[] {
  const earned: string[] = [];
  if (isWinner && p.wins === 1) earned.push('first_win');
  if (isWinner && p.winStreak >= 3) earned.push('streak_3');
  if (isWinner && p.winStreak >= 5) earned.push('streak_5');
  if (p.gamesPlayed >= 5) earned.push('played_5');
  if (p.gamesPlayed >= 10) earned.push('played_10');
  if (p.gamesPlayed >= 25) earned.push('played_25');
  if (p.gamesPlayed >= 50) earned.push('played_50');
  if (p.gamesPlayed >= 5 && p.wins / p.gamesPlayed >= 0.7) earned.push('high_win_rate');
  if (isWinner && hadPriorLoss && p.winStreak === 1) earned.push('comeback_win');
  if (!isWinner && p.lossStreak >= 3) earned.push('cold_streak');
  if (isUnderdogWin) earned.push('underdog_win');
  return earned;
}

export async function getActiveMatch(courtId: string): Promise<Match | undefined> {
  const { data } = await supabase.from('matches').select('*').eq('court_id', courtId).is('ended_at', null).single();
  if (!data) return undefined;
  return {
    id: data.id,
    courtId: data.court_id || '',
    players: data.players || [],
    matchType: data.match_type as Match['matchType'],
    winner: data.winner,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    sessionId: data.session_id,
    eloChanges: data.elo_changes || {},
  };
}

// ── Settings ──
export async function getSettings(): Promise<Settings> {
  const { data } = await supabase.from('settings').select('*').eq('id', 'default').single();
  if (!data) return {
    id: 'default',
    matchTypeDefault: 'doubles',
    numberOfCourts: 3,
    singlesShuttleFee: 60,
    doublesShuttleFee: 30,
    courtFeePerPlayer: 120,
    includeShuttleFee: true,
    currency: '₱',
    totalCourtFee: 1400,
    totalShuttleFee: 420,
    feeCalculationMode: 'per-game-split',
  };
  return {
    id: data.id,
    matchTypeDefault: data.match_type_default as Settings['matchTypeDefault'],
    numberOfCourts: data.number_of_courts,
    singlesShuttleFee: data.singles_shuttle_fee,
    doublesShuttleFee: data.doubles_shuttle_fee,
    courtFeePerPlayer: data.court_fee_per_player,
    includeShuttleFee: data.include_shuttle_fee,
    currency: data.currency,
    totalCourtFee: data.total_court_fee ?? 1400,
    totalShuttleFee: data.total_shuttle_fee ?? 420,
    feeCalculationMode: (data.fee_calculation_mode as Settings['feeCalculationMode']) ?? 'per-game-split',
  };
}

export async function updateSettings(settings: Settings): Promise<void> {
  const { error } = await supabase.from('settings').update({
    match_type_default: settings.matchTypeDefault,
    number_of_courts: settings.numberOfCourts,
    singles_shuttle_fee: settings.singlesShuttleFee,
    doubles_shuttle_fee: settings.doublesShuttleFee,
    court_fee_per_player: settings.courtFeePerPlayer,
    include_shuttle_fee: settings.includeShuttleFee,
    currency: settings.currency,
    total_court_fee: settings.totalCourtFee,
    total_shuttle_fee: settings.totalShuttleFee,
    fee_calculation_mode: settings.feeCalculationMode,
  }).eq('id', 'default');
  if (error) throw error;
}

// ── Smart Queue ──
export async function getNextPlayers(matchType: 'singles' | 'doubles'): Promise<Player[]> {
  const queue = await getQueue();
  const playerIds = queue.map(q => q.playerId);
  if (playerIds.length === 0) return [];
  
  const { data } = await supabase.from('players').select('*').in('id', playerIds).eq('status', 'waiting');
  const players: Player[] = (data || []).map(row => toCamelCase<Player>(row));
  
  const sorted = players.sort((a, b) => {
    const aIdx = playerIds.indexOf(a.id);
    const bIdx = playerIds.indexOf(b.id);
    return aIdx - bIdx;
  });

  if (matchType === 'singles') return sorted.slice(0, 2);
  
  const balanced = sorted
    .map(p => ({ player: p, ratio: p.gamesPlayed > 0 ? p.wins / p.gamesPlayed : 0 }))
    .sort((a, b) => a.ratio - b.ratio || a.player.gamesPlayed - b.player.gamesPlayed);
  return balanced.slice(0, 4).map(i => i.player);
}

// ── Accounts ──
export async function getAllAccounts(): Promise<Account[]> {
  const { data, error } = await supabase.from('accounts').select('*');
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    pin: row.pin,
    playerId: row.player_id,
    role: row.role as Account['role'],
    createdAt: row.created_at,
  }));
}

export async function getAccount(id: string): Promise<Account | undefined> {
  const { data } = await supabase.from('accounts').select('*').eq('id', id).single();
  if (!data) return undefined;
  return {
    id: data.id,
    name: data.name,
    pin: data.pin,
    playerId: data.player_id,
    role: data.role as Account['role'],
    createdAt: data.created_at,
  };
}

export async function getAccountByName(name: string): Promise<Account | undefined> {
  const { data } = await supabase.from('accounts').select('*').eq('name', name).single();
  if (!data) return undefined;
  return {
    id: data.id,
    name: data.name,
    pin: data.pin,
    playerId: data.player_id,
    role: data.role as Account['role'],
    createdAt: data.created_at,
  };
}

export async function createAccount(name: string, pin: string | null, role: 'admin' | 'player'): Promise<Account> {
  const { data, error } = await supabase.from('accounts').insert({
    name,
    pin,
    player_id: null,
    role,
    created_at: Date.now(),
  }).select().single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    pin: data.pin,
    playerId: data.player_id,
    role: data.role as Account['role'],
    createdAt: data.created_at,
  };
}

export async function updateAccount(account: Account): Promise<void> {
  const { error } = await supabase.from('accounts').update({
    name: account.name,
    pin: account.pin,
    player_id: account.playerId,
    role: account.role,
  }).eq('id', account.id);
  if (error) throw error;
}

export async function ensureAdminAccount(): Promise<void> {
  const { data } = await supabase.from('accounts').select('*').eq('role', 'admin').single();
  if (!data) {
    await supabase.from('accounts').insert({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Admin',
      pin: null,
      player_id: null,
      role: 'admin',
      created_at: Date.now(),
    });
  }
}

// ── Sessions ──
export async function getAllSessions(): Promise<GameSession[]> {
  const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    joinCode: row.join_code,
    name: row.name,
    status: row.status as GameSession['status'],
    createdAt: row.created_at,
    closedAt: row.closed_at,
    playerIds: row.player_ids || [],
  }));
}

export async function getSession(id: string): Promise<GameSession | undefined> {
  const { data } = await supabase.from('sessions').select('*').eq('id', id).single();
  if (!data) return undefined;
  return {
    id: data.id,
    joinCode: data.join_code,
    name: data.name,
    status: data.status as GameSession['status'],
    createdAt: data.created_at,
    closedAt: data.closed_at,
    playerIds: data.player_ids || [],
  };
}

export async function getSessionByCode(code: string): Promise<GameSession | undefined> {
  const { data } = await supabase.from('sessions').select('*').eq('join_code', code.toUpperCase()).eq('status', 'active').single();
  if (!data) return undefined;
  return {
    id: data.id,
    joinCode: data.join_code,
    name: data.name,
    status: data.status as GameSession['status'],
    createdAt: data.created_at,
    closedAt: data.closed_at,
    playerIds: data.player_ids || [],
  };
}

export async function createSession(name: string): Promise<GameSession> {
  let code = generateJoinCode();
  let existing = await getSessionByCode(code);
  while (existing) {
    code = generateJoinCode();
    existing = await getSessionByCode(code);
  }

  const { data, error } = await supabase.from('sessions').insert({
    join_code: code,
    name,
    status: 'active',
    created_at: Date.now(),
    closed_at: null,
    player_ids: [],
  }).select().single();
  if (error) throw error;

  return {
    id: data.id,
    joinCode: data.join_code,
    name: data.name,
    status: data.status as GameSession['status'],
    createdAt: data.created_at,
    closedAt: data.closed_at,
    playerIds: data.player_ids || [],
  };
}

export async function closeSession(id: string): Promise<void> {
  // Get the session to find all player IDs
  const { data: session, error: fetchError } = await supabase.from('sessions').select('*').eq('id', id).single();
  if (fetchError) {
    console.error('Error fetching session:', fetchError);
    throw fetchError;
  }
  
  console.log('Closing session:', session);
  console.log('Player IDs in session:', session?.player_ids);

  // Calculate fees if using per-game-split mode
  const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'default').single();
  if (settingsData && settingsData.fee_calculation_mode === 'per-game-split') {
    await calculateSessionFees(id);
  }
  
  // Close the session
  const { error } = await supabase.from('sessions').update({
    status: 'closed',
    closed_at: Date.now(),
  }).eq('id', id);
  if (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
  
  // Remove all players from this session from the queue
  if (session && session.player_ids && session.player_ids.length > 0) {
    console.log('Removing players from queue:', session.player_ids);
    const { error: deleteError, data: deletedData } = await supabase.from('queue').delete().in('player_id', session.player_ids).select();
    if (deleteError) {
      console.error('Error removing players from queue:', deleteError);
      throw deleteError;
    }
    console.log('Deleted queue entries:', deletedData);
  } else {
    console.log('No players to remove from queue');
  }
}

// Calculate fees based on total players in session (equal split)
async function calculateSessionFees(sessionId: string): Promise<void> {
  const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'default').single();
  if (!settingsData) return;

  const totalCourtFee = settingsData.total_court_fee ?? 1400;
  const totalShuttleFee = settingsData.total_shuttle_fee ?? 420;
  const includeShuttle = settingsData.include_shuttle_fee ?? true;

  // Get the session to find all players
  const { data: session } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
  if (!session || !session.player_ids || session.player_ids.length === 0) return;

  const totalPlayers = session.player_ids.length;
  const totalFees = totalCourtFee + (includeShuttle ? totalShuttleFee : 0);
  
  // Equal split: total fees divided by number of players
  const feePerPlayer = Math.round((totalFees / totalPlayers) * 100) / 100;

  // Update each player's fee_owed
  for (const playerId of session.player_ids) {
    const { data: player } = await supabase.from('players').select('*').eq('id', playerId).single();
    if (player) {
      await supabase.from('players').update({
        fee_owed: player.fee_owed + feePerPlayer,
      }).eq('id', playerId);
    }
  }
}

export async function joinSession(code: string, playerId: string): Promise<GameSession | { error: string } | null> {
  const { data: allSessions } = await supabase.from('sessions').select('*').eq('join_code', code.toUpperCase());
  const match = allSessions?.[0];
  if (!match) return null;
  if (match.status !== 'active') return { error: 'This session has been closed.' };
  
  const playerIds = match.player_ids || [];
  if (!playerIds.includes(playerId)) {
    playerIds.push(playerId);
    await supabase.from('sessions').update({ player_ids: playerIds }).eq('id', match.id);
  }
  await addToQueue(playerId);
  
  return {
    id: match.id,
    joinCode: match.join_code,
    name: match.name,
    status: match.status as GameSession['status'],
    createdAt: match.created_at,
    closedAt: match.closed_at,
    playerIds,
  };
}

// ── Reset ──
export async function resetAllData(): Promise<void> {
  await supabase.from('queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('courts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

function generateJoinCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `RQ-${num}`;
}

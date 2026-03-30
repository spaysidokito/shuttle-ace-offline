-- Migration: Add loss_streak to players, elo_changes to matches, and new fee calculation fields

-- Add loss_streak column to players (tracks consecutive losses for Cold Streak achievement)
ALTER TABLE players ADD COLUMN IF NOT EXISTS loss_streak INTEGER DEFAULT 0;

-- Add elo_changes column to matches (stores per-player ELO delta as JSON)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS elo_changes JSONB DEFAULT '{}';

-- Add elo column to players if not already added
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo INTEGER DEFAULT 1200;

-- Index for ELO-based queries
CREATE INDEX IF NOT EXISTS players_elo_idx ON players(elo DESC);

-- Add new fee calculation fields to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS total_court_fee NUMERIC DEFAULT 1400;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS total_shuttle_fee NUMERIC DEFAULT 420;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS fee_calculation_mode TEXT DEFAULT 'per-game-split' CHECK (fee_calculation_mode IN ('per-player', 'per-game-split'));


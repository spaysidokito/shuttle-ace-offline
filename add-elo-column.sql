-- Add ELO rating column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo INTEGER DEFAULT 1200;

-- Create index for ELO-based queries
CREATE INDEX IF NOT EXISTS players_elo_idx ON players(elo DESC);

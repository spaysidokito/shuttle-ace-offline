-- Fix database schema - run this in Supabase SQL Editor

-- 1. Add columns to players table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='elo') THEN
        ALTER TABLE players ADD COLUMN elo INTEGER DEFAULT 1200;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='loss_streak') THEN
        ALTER TABLE players ADD COLUMN loss_streak INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Add column to matches table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='elo_changes') THEN
        ALTER TABLE matches ADD COLUMN elo_changes JSONB DEFAULT '{}';
    END IF;
END $$;

-- 3. Add columns to settings table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='total_court_fee') THEN
        ALTER TABLE settings ADD COLUMN total_court_fee NUMERIC DEFAULT 1400;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='total_shuttle_fee') THEN
        ALTER TABLE settings ADD COLUMN total_shuttle_fee NUMERIC DEFAULT 420;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='fee_calculation_mode') THEN
        ALTER TABLE settings ADD COLUMN fee_calculation_mode TEXT DEFAULT 'per-game-split';
    END IF;
END $$;

-- 4. Create index for ELO queries
CREATE INDEX IF NOT EXISTS players_elo_idx ON players(elo DESC);

-- 5. Verify columns were added
SELECT 'Players columns:' as info;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name IN ('elo', 'loss_streak');

SELECT 'Matches columns:' as info;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND column_name = 'elo_changes';

SELECT 'Settings columns:' as info;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND column_name IN ('total_court_fee', 'total_shuttle_fee', 'fee_calculation_mode');

# Fee Calculation System

## Overview
The system now supports two fee calculation modes:

### 1. Per-Player Mode (Old Way)
- Each player pays a fixed fee per match
- Fees are charged when the match starts
- Settings: `courtFeePerPlayer`, `singlesShuttleFee`, `doublesShuttleFee`

### 2. Per-Game-Split Mode (New Way - Based on Your Previous Game)
- Total session costs are divided by total games played
- Each player pays based on their number of games
- Fees are calculated when the session closes
- Settings: `totalCourtFee`, `totalShuttleFee`

## Formula (Per-Game-Split Mode)

```
Court Fee per Game = (Total Court Fee / # of Games) / 4
Shuttle Fee per Game = (Total Shuttle Fee / # of Games) / 4
Total Fee per Game = Court Fee per Game + Shuttle Fee per Game

Player Fee = Total Fee per Game × Player's Games Played
```

## Example (From Your Previous Game)

**Session Totals:**
- Total Court Fee: ₱1400
- Total Shuttle Fee: ₱420
- Total Games: 16
- Total Players: 14

**Calculations:**
- Court Fee per Game = (1400 / 16) / 4 = ₱21.88
- Shuttle Fee per Game = (420 / 16) / 4 = ₱6.56
- Total per Game = ₱28.44

**Player Examples:**
- Alexis (7 games): 7 × 28.44 = ₱199.06
- Ron (5 games): 5 × 28.44 = ₱142.19
- Plinky (3 games): 3 × 28.44 = ₱85.31

## How to Use

### Setup (Settings Page)
1. Go to Settings
2. Select "Per Game Split" as Fee Calculation Mode
3. Enter:
   - Total Court Fee (e.g., ₱1400)
   - Total Shuttle Fee (e.g., ₱420)
   - Toggle "Include shuttle fee in billing" ON/OFF
4. Save Settings

### During Play
- Fees are NOT charged when matches start
- Players play their games normally
- Track is kept of how many games each player plays

### End of Session
1. Go to Sessions page
2. Click "Close Session"
3. System automatically:
   - Counts total games played
   - Calculates fee per game
   - Charges each player based on their games
   - Updates `fee_owed` for each player

## Database Migration

Run this SQL in your Supabase SQL editor:

```sql
-- Add new fee calculation fields
ALTER TABLE settings ADD COLUMN IF NOT EXISTS total_court_fee NUMERIC DEFAULT 1400;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS total_shuttle_fee NUMERIC DEFAULT 420;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS fee_calculation_mode TEXT DEFAULT 'per-game-split' 
  CHECK (fee_calculation_mode IN ('per-player', 'per-game-split'));
```

## Benefits

✅ Fair distribution - players only pay for games they play
✅ Transparent - everyone sees the same per-game rate
✅ Flexible - works with varying numbers of players and games
✅ Accurate - no rounding errors from upfront charging

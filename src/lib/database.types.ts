export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          games_played: number
          wins: number
          losses: number
          points: number
          status: 'waiting' | 'playing' | 'finished'
          created_at: number
          fee_paid: number
          fee_owed: number
          win_streak: number
          loss_streak: number
          last_played: number | null
          achievements: string[]
          account_id: string | null
          elo: number
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          games_played?: number
          wins?: number
          losses?: number
          points?: number
          status?: 'waiting' | 'playing' | 'finished'
          created_at: number
          fee_paid?: number
          fee_owed?: number
          win_streak?: number
          loss_streak?: number
          last_played?: number | null
          achievements?: string[]
          account_id?: string | null
          elo?: number
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          games_played?: number
          wins?: number
          losses?: number
          points?: number
          status?: 'waiting' | 'playing' | 'finished'
          created_at?: number
          fee_paid?: number
          fee_owed?: number
          win_streak?: number
          loss_streak?: number
          last_played?: number | null
          achievements?: string[]
          account_id?: string | null
          elo?: number
          updated_at?: string
        }
      }
      courts: {
        Row: {
          id: string
          name: string
          status: 'available' | 'playing' | 'waiting'
          players: string[]
          match_type: 'singles' | 'doubles'
          session_fee_applied: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: 'available' | 'playing' | 'waiting'
          players?: string[]
          match_type?: 'singles' | 'doubles'
          session_fee_applied?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: 'available' | 'playing' | 'waiting'
          players?: string[]
          match_type?: 'singles' | 'doubles'
          session_fee_applied?: boolean
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          court_id: string | null
          players: string[]
          match_type: 'singles' | 'doubles'
          winner: string[] | null
          started_at: number
          ended_at: number | null
          session_id: string | null
          elo_changes: Record<string, number> | null
          created_at: string
        }
        Insert: {
          id?: string
          court_id?: string | null
          players: string[]
          match_type: 'singles' | 'doubles'
          winner?: string[] | null
          started_at: number
          ended_at?: number | null
          session_id?: string | null
          elo_changes?: Record<string, number> | null
          created_at?: string
        }
        Update: {
          id?: string
          court_id?: string | null
          players?: string[]
          match_type?: 'singles' | 'doubles'
          winner?: string[] | null
          started_at?: number
          ended_at?: number | null
          session_id?: string | null
          elo_changes?: Record<string, number> | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          match_type_default: 'singles' | 'doubles'
          number_of_courts: number
          singles_shuttle_fee: number
          doubles_shuttle_fee: number
          court_fee_per_player: number
          include_shuttle_fee: boolean
          currency: string
          total_court_fee: number
          total_shuttle_fee: number
          fee_calculation_mode: 'per-player' | 'per-game-split'
          updated_at: string
        }
        Insert: {
          id?: string
          match_type_default?: 'singles' | 'doubles'
          number_of_courts?: number
          singles_shuttle_fee?: number
          doubles_shuttle_fee?: number
          court_fee_per_player?: number
          include_shuttle_fee?: boolean
          currency?: string
          total_court_fee?: number
          total_shuttle_fee?: number
          fee_calculation_mode?: 'per-player' | 'per-game-split'
          updated_at?: string
        }
        Update: {
          id?: string
          match_type_default?: 'singles' | 'doubles'
          number_of_courts?: number
          singles_shuttle_fee?: number
          doubles_shuttle_fee?: number
          court_fee_per_player?: number
          include_shuttle_fee?: boolean
          currency?: string
          total_court_fee?: number
          total_shuttle_fee?: number
          fee_calculation_mode?: 'per-player' | 'per-game-split'
          updated_at?: string
        }
      }
      queue: {
        Row: {
          id: string
          player_id: string
          added_at: number
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          added_at: number
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          added_at?: number
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          name: string
          pin: string | null
          player_id: string | null
          role: 'admin' | 'player'
          created_at: number
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          pin?: string | null
          player_id?: string | null
          role?: 'admin' | 'player'
          created_at: number
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          pin?: string | null
          player_id?: string | null
          role?: 'admin' | 'player'
          created_at?: number
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          join_code: string
          name: string
          status: 'active' | 'closed'
          created_at: number
          closed_at: number | null
          player_ids: string[]
          updated_at: string
        }
        Insert: {
          id?: string
          join_code: string
          name: string
          status?: 'active' | 'closed'
          created_at: number
          closed_at?: number | null
          player_ids?: string[]
          updated_at?: string
        }
        Update: {
          id?: string
          join_code?: string
          name?: string
          status?: 'active' | 'closed'
          created_at?: number
          closed_at?: number | null
          player_ids?: string[]
          updated_at?: string
        }
      }
    }
  }
}

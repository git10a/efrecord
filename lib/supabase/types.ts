export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      opponents: {
        Row: {
          id: string
          name: string
          created_by: string
          is_shared: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          is_shared?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          is_shared?: boolean
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user_id: string
          opponent_id: string
          user_score: number
          opponent_score: number
          result: 'win' | 'draw' | 'loss'
          match_date: string
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          opponent_id: string
          user_score: number
          opponent_score: number
          result?: 'win' | 'draw' | 'loss'
          match_date?: string
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          opponent_id?: string
          user_score?: number
          opponent_score?: number
          result?: 'win' | 'draw' | 'loss'
          match_date?: string
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_stats: {
        Row: {
          user_id: string
          total_matches: number
          total_wins: number
          total_draws: number
          total_losses: number
          current_streak: number
          best_win_streak: number
          worst_loss_streak: number
          last_match_date: string | null
          updated_at: string
          team_name: string | null
        }
        Insert: {
          user_id: string
          total_matches?: number
          total_wins?: number
          total_draws?: number
          total_losses?: number
          current_streak?: number
          best_win_streak?: number
          worst_loss_streak?: number
          last_match_date?: string | null
          updated_at?: string
          team_name?: string | null
        }
        Update: {
          user_id?: string
          total_matches?: number
          total_wins?: number
          total_draws?: number
          total_losses?: number
          current_streak?: number
          best_win_streak?: number
          worst_loss_streak?: number
          last_match_date?: string | null
          updated_at?: string
          team_name?: string | null
        }
      }
      opponent_stats: {
        Row: {
          id: string
          user_id: string
          opponent_id: string
          matches: number
          wins: number
          draws: number
          losses: number
          goals_for: number
          goals_against: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          opponent_id: string
          matches?: number
          wins?: number
          draws?: number
          losses?: number
          goals_for?: number
          goals_against?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          opponent_id?: string
          matches?: number
          wins?: number
          draws?: number
          losses?: number
          goals_for?: number
          goals_against?: number
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
// API related types
import { Match, Opponent, Profile, UserStats, OpponentStats, Player, Formation } from './supabase';

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    status?: number;
  };
}

// Match related types
export interface MatchesResponse {
  matches: Match[];
  total: number;
}

export interface MatchFormData {
  opponent_id: string;
  user_score: number;
  opponent_score: number;
  match_date: string;
  memo?: string;
}

// Opponent related types
export interface OpponentsResponse {
  opponents: Opponent[];
  total: number;
}

export interface OpponentFormData {
  name: string;
  is_shared?: boolean;
}

// User related types
export interface UserProfileResponse {
  profile: Profile;
  stats: UserStats;
}

export interface UserProfileFormData {
  username: string;
  display_name: string;
  team_name?: string;
}

// Stats related types
export interface StatsTimeRange {
  range: 'all' | 'month' | 'week' | '3days' | 'today';
  label: string;
}

export interface StatsFilters {
  timeRange: StatsTimeRange['range'];
  opponentId?: string;
}

// Formation related types
export interface FormationWithPositions extends Formation {
  positions: Array<{
    player: Player;
    position: {
      x: number;
      y: number;
      display: string;
    };
  }>;
}
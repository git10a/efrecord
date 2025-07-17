// Component related types
import { Match, Opponent, UserStats, OpponentStats, Player, Formation } from './supabase';

// Common props
export interface WithChildrenProps {
  children: React.ReactNode;
}

export interface WithClassNameProps {
  className?: string;
}

// Dashboard components
export interface DashboardProps {
  userId: string;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  className?: string;
}

export interface RecentMatchesProps {
  userId: string;
  limit?: number;
}

// Match components
export interface MatchCardProps {
  match: Match;
  opponent?: Opponent;
}

export interface MatchFormProps {
  initialData?: Partial<Match>;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export interface MatchListProps {
  matches: Match[];
  opponents: Record<string, Opponent>;
}

export interface MatchFilterProps {
  opponents: Opponent[];
  selectedOpponentId: string | null;
  onOpponentChange: (id: string | null) => void;
}

// Team components
export interface TeamStatsProps {
  stats: OpponentStats;
  opponent: Opponent;
}

export interface TeamWinRateChartProps {
  matches: Array<{
    id: string;
    result: string;
    match_date: string;
    created_at: string;
  }>;
  className?: string;
}

export interface TeamFormProps {
  initialData?: Partial<Opponent>;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

// Formation components
export interface FormationEditorProps {
  formation: Formation;
  players: Player[];
  onSave: (positions: any[]) => Promise<void>;
}

export interface PlayerCardProps {
  player: Player;
  isDragging?: boolean;
}

export interface PitchPositionProps {
  x: number;
  y: number;
  player?: Player;
  displayPosition: string;
}

// UI components
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export interface CardProps extends WithChildrenProps, WithClassNameProps {
  title?: string;
  footer?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

export interface GridScoreInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  maxGrid?: number;
  className?: string;
}
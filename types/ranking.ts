import { UserStats } from './supabase'

export interface UserStatsWithPoints extends UserStats {
  win_rate: number
  total_points_scored: number
  total_points_conceded: number
  average_points_scored: number
  average_points_conceded: number
}

export type RankingType = 'win_rate' | 'total_wins' | 'total_points' | 'average_points' | 'total_goals_conceded' | 'average_goals_conceded'

export interface RankingConfig {
  type: RankingType
  label: string
  shortLabel: string
  primaryMetric: keyof UserStatsWithPoints
  formatPrimary: (value: number) => string
  sortOrder?: 'asc' | 'desc' // 昇順または降順ソート（デフォルトは降順）
  secondaryMetrics: Array<{
    key: keyof UserStatsWithPoints
    label: string
    format: (value: number) => string
  }>
}

export interface TeamRankCardProps {
  rank: number
  team: UserStatsWithPoints
  rankingType: RankingType
  isCurrentUser?: boolean
  currentUserRank?: number
}

export interface RankingTabsProps {
  activeTab: RankingType
  onTabChange: (tab: RankingType) => void
}

export interface RankingListProps {
  teams: UserStatsWithPoints[]
  rankingType: RankingType
  currentUserId?: string
  isLoading?: boolean
  error?: Error | null
}

export interface RankingPageData {
  teams: UserStatsWithPoints[]
  currentUserTeam?: UserStatsWithPoints
  currentUserRank?: number
}
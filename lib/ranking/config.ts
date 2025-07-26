import { RankingConfig, RankingType } from '@/types/ranking'

export const rankingConfigs: Record<RankingType, RankingConfig> = {
  win_rate: {
    type: 'win_rate',
    label: '勝率',
    shortLabel: '勝率',
    primaryMetric: 'win_rate',
    formatPrimary: (value: number) => `${value.toFixed(1)}%`,
    secondaryMetrics: [
      {
        key: 'total_matches',
        label: '試合数',
        format: (value: number) => `${value}試合`
      },
      {
        key: 'total_wins',
        label: '勝利',
        format: (value: number) => `${value}勝`
      },
      {
        key: 'total_draws',
        label: '引分',
        format: (value: number) => `${value}分`
      },
      {
        key: 'total_losses',
        label: '敗北',
        format: (value: number) => `${value}敗`
      }
    ]
  },
  total_wins: {
    type: 'total_wins',
    label: '勝利数',
    shortLabel: '勝利数',
    primaryMetric: 'total_wins',
    formatPrimary: (value: number) => `${value}勝`,
    secondaryMetrics: [
      {
        key: 'total_matches',
        label: '試合数',
        format: (value: number) => `${value}試合`
      },
      {
        key: 'win_rate',
        label: '勝率',
        format: (value: number) => `${value.toFixed(1)}%`
      }
    ]
  },
  total_points: {
    type: 'total_points',
    label: '合計得点',
    shortLabel: '合計得点',
    primaryMetric: 'total_points_scored',
    formatPrimary: (value: number) => `${value}点`,
    secondaryMetrics: [
      {
        key: 'total_matches',
        label: '試合数',
        format: (value: number) => `${value}試合`
      },
      {
        key: 'average_points_scored',
        label: '平均得点',
        format: (value: number) => `${value.toFixed(1)}点/試合`
      }
    ]
  },
  average_points: {
    type: 'average_points',
    label: '平均得点',
    shortLabel: '平均得点',
    primaryMetric: 'average_points_scored',
    formatPrimary: (value: number) => `${value.toFixed(1)}点`,
    secondaryMetrics: [
      {
        key: 'total_points_scored',
        label: '合計得点',
        format: (value: number) => `${value}点`
      },
      {
        key: 'total_matches',
        label: '試合数',
        format: (value: number) => `${value}試合`
      }
    ]
  },
  total_goals_conceded: {
    type: 'total_goals_conceded',
    label: '合計失点',
    shortLabel: '合計失点',
    primaryMetric: 'total_points_conceded',
    formatPrimary: (value: number) => `${value}点`,
    sortOrder: 'asc', // 失点は少ない方が良いので昇順
    secondaryMetrics: [
      {
        key: 'total_matches',
        label: '試合数',
        format: (value: number) => `${value}試合`
      },
      {
        key: 'average_points_conceded',
        label: '平均失点',
        format: (value: number) => `${value.toFixed(1)}点/試合`
      }
    ]
  },
  average_goals_conceded: {
    type: 'average_goals_conceded',
    label: '平均失点',
    shortLabel: '平均失点',
    primaryMetric: 'average_points_conceded',
    formatPrimary: (value: number) => `${value.toFixed(1)}点`,
    sortOrder: 'asc', // 失点は少ない方が良いので昇順
    secondaryMetrics: [
      {
        key: 'total_points_conceded',
        label: '合計失点',
        format: (value: number) => `${value}点`
      },
      {
        key: 'total_matches',
        label: '試合数',
        format: (value: number) => `${value}試合`
      }
    ]
  }
}
import { UserStatsWithPoints, RankingType } from '@/types/ranking'

export function calculateWinRate(wins: number, totalMatches: number): number {
  if (totalMatches === 0) return 0
  return (wins / totalMatches) * 100
}

export function calculateAveragePoints(totalPoints: number, totalMatches: number): number {
  if (totalMatches === 0) return 0
  return totalPoints / totalMatches
}

export function sortTeamsByRanking(
  teams: UserStatsWithPoints[],
  rankingType: RankingType
): UserStatsWithPoints[] {
  const sortedTeams = [...teams]

  switch (rankingType) {
    case 'win_rate':
      // Exclude teams with zero matches from win rate ranking
      return sortedTeams
        .filter(team => team.total_matches > 0)
        .sort((a, b) => {
          // Primary sort by win rate (descending)
          if (b.win_rate !== a.win_rate) {
            return b.win_rate - a.win_rate
          }
          // Tie-breaker 1: total matches (descending)
          if (b.total_matches !== a.total_matches) {
            return b.total_matches - a.total_matches
          }
          // Tie-breaker 2: team name (ascending)
          return (a.team_name || '').localeCompare(b.team_name || '')
        })

    case 'total_wins':
      return sortedTeams.sort((a, b) => {
        // Primary sort by total wins (descending)
        if (b.total_wins !== a.total_wins) {
          return b.total_wins - a.total_wins
        }
        // Tie-breaker 1: total matches (descending)
        if (b.total_matches !== a.total_matches) {
          return b.total_matches - a.total_matches
        }
        // Tie-breaker 2: team name (ascending)
        return (a.team_name || '').localeCompare(b.team_name || '')
      })

    case 'total_points':
      return sortedTeams.sort((a, b) => {
        // Primary sort by total points scored (descending)
        if (b.total_points_scored !== a.total_points_scored) {
          return b.total_points_scored - a.total_points_scored
        }
        // Tie-breaker 1: total matches (descending)
        if (b.total_matches !== a.total_matches) {
          return b.total_matches - a.total_matches
        }
        // Tie-breaker 2: team name (ascending)
        return (a.team_name || '').localeCompare(b.team_name || '')
      })

    case 'average_points':
      // Exclude teams with zero matches from average points ranking
      return sortedTeams
        .filter(team => team.total_matches > 0)
        .sort((a, b) => {
          // Primary sort by average points scored (descending)
          if (b.average_points_scored !== a.average_points_scored) {
            return b.average_points_scored - a.average_points_scored
          }
          // Tie-breaker 1: total matches (descending)
          if (b.total_matches !== a.total_matches) {
            return b.total_matches - a.total_matches
          }
          // Tie-breaker 2: team name (ascending)
          return (a.team_name || '').localeCompare(b.team_name || '')
        })

    default:
      return sortedTeams
  }
}

export function getUserRank(
  teams: UserStatsWithPoints[],
  userId: string,
  rankingType: RankingType
): number | undefined {
  const sortedTeams = sortTeamsByRanking(teams, rankingType)
  const userIndex = sortedTeams.findIndex(team => team.user_id === userId)
  return userIndex >= 0 ? userIndex + 1 : undefined
}

export function getTopTeams(
  teams: UserStatsWithPoints[],
  rankingType: RankingType,
  limit: number = 5
): UserStatsWithPoints[] {
  return sortTeamsByRanking(teams, rankingType).slice(0, limit)
}
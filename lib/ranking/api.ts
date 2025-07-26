import { createClient } from '@/lib/supabase/client'
import { UserStatsWithPoints } from '@/types/ranking'
import { calculateWinRate, calculateAveragePoints } from './utils'

export async function fetchTeamRankings(): Promise<UserStatsWithPoints[]> {
  const supabase = createClient()

  // Fetch all user stats
  const { data: userStats, error: statsError } = await supabase
    .from('user_stats')
    .select('*')
    .order('total_wins', { ascending: false })

  if (statsError) {
    throw new Error(`Failed to fetch user stats: ${statsError.message}`)
  }

  if (!userStats || userStats.length === 0) {
    return []
  }

  // Fetch point data for all users
  const userIds = userStats.map(stat => stat.user_id)
  
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('user_id, user_score, opponent_score')
    .in('user_id', userIds)

  if (matchesError) {
    throw new Error(`Failed to fetch matches: ${matchesError.message}`)
  }

  // Calculate points for each user
  const pointsMap = new Map<string, { totalScored: number; totalConceded: number }>()
  
  if (matches) {
    matches.forEach(match => {
      const current = pointsMap.get(match.user_id) || { totalScored: 0, totalConceded: 0 }
      current.totalScored += match.user_score
      current.totalConceded += match.opponent_score
      pointsMap.set(match.user_id, current)
    })
  }

  // Combine stats with calculated fields
  const teamsWithPoints: UserStatsWithPoints[] = userStats.map(stat => {
    const points = pointsMap.get(stat.user_id) || { totalScored: 0, totalConceded: 0 }
    const winRate = calculateWinRate(stat.total_wins, stat.total_matches)
    const averagePointsScored = calculateAveragePoints(points.totalScored, stat.total_matches)
    const averagePointsConceded = calculateAveragePoints(points.totalConceded, stat.total_matches)

    return {
      ...stat,
      win_rate: winRate,
      total_points_scored: points.totalScored,
      total_points_conceded: points.totalConceded,
      average_points_scored: averagePointsScored,
      average_points_conceded: averagePointsConceded
    }
  })

  return teamsWithPoints
}

export async function fetchUserTeamRanking(userId: string): Promise<UserStatsWithPoints | null> {
  const supabase = createClient()

  // Fetch user stats
  const { data: userStat, error: statsError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (statsError || !userStat) {
    return null
  }

  // Fetch point data for the user
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('user_score, opponent_score')
    .eq('user_id', userId)

  if (matchesError) {
    throw new Error(`Failed to fetch user matches: ${matchesError.message}`)
  }

  // Calculate points
  let totalScored = 0
  let totalConceded = 0
  
  if (matches) {
    matches.forEach(match => {
      totalScored += match.user_score
      totalConceded += match.opponent_score
    })
  }

  const winRate = calculateWinRate(userStat.total_wins, userStat.total_matches)
  const averagePointsScored = calculateAveragePoints(totalScored, userStat.total_matches)
  const averagePointsConceded = calculateAveragePoints(totalConceded, userStat.total_matches)

  return {
    ...userStat,
    win_rate: winRate,
    total_points_scored: totalScored,
    total_points_conceded: totalConceded,
    average_points_scored: averagePointsScored,
    average_points_conceded: averagePointsConceded
  }
}
'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamWinRateChart } from './team-win-rate-chart'
import { Target, TrendingUp, Activity, Flame, CloudRain, Zap, Wind, Droplets, CloudLightning } from 'lucide-react'

interface Match {
  id: string
  user_score: number
  opponent_score: number
  result: string
  match_date: string
  created_at: string
}

interface TeamStatsProps {
  userId: string
  opponentId: string
  teamName: string
  globalPeriod: PeriodFilter
}

type PeriodFilter = 'all' | '1month' | '1week' | '3days' | 'today'


const getDateFilter = (period: PeriodFilter): string | null => {
  if (period === 'all') return null
  
  const now = new Date()
  let startDate: Date
  
  switch (period) {
    case '1month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      break
    case '1week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '3days':
      startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      break
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    default:
      return null
  }
  
  return startDate.toISOString().split('T')[0]
}

interface TeamStatsData {
  totalMatches: number
  wins: number
  draws: number
  losses: number
  currentStreak: number
  bestWinStreak: number
  worstLossStreak: number
  recentWinRate: number
  matches: Match[]
  totalPointsScored: number
  totalPointsConceded: number
  averagePointsScored: number
  averagePointsConceded: number
}

export function TeamStats({ userId, opponentId, globalPeriod }: TeamStatsProps) {
  const supabase = createClient()

  const { data: teamStats } = useQuery({
    queryKey: ['teamStats', userId, opponentId],
    queryFn: async (): Promise<TeamStatsData> => {
      // そのチームとの全試合を取得
      const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', userId)
        .eq('opponent_id', opponentId)
        .order('match_date', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error

      const totalMatches = matches?.length || 0
      if (totalMatches === 0) {
        return {
          totalMatches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          currentStreak: 0,
          bestWinStreak: 0,
          worstLossStreak: 0,
          recentWinRate: 0,
          matches: [],
          totalPointsScored: 0,
          totalPointsConceded: 0,
          averagePointsScored: 0,
          averagePointsConceded: 0
        }
      }

      // 全期間の得失点を計算（デフォルト表示用）
      const totalPointsScored = matches.reduce((sum, match) => sum + match.user_score, 0)
      const totalPointsConceded = matches.reduce((sum, match) => sum + match.opponent_score, 0)
      const averagePointsScored = totalMatches > 0 ? Number((totalPointsScored / totalMatches).toFixed(1)) : 0
      const averagePointsConceded = totalMatches > 0 ? Number((totalPointsConceded / totalMatches).toFixed(1)) : 0

      // 基本統計を計算
      const wins = matches.filter(m => m.result === 'win').length
      const draws = matches.filter(m => m.result === 'draw').length
      const losses = matches.filter(m => m.result === 'loss').length

      // 現在の連勝/連敗記録を計算（最新の試合から遡る）
      const recentMatches = [...matches].reverse() // 最新順にソート
      let currentStreak = 0
      if (recentMatches.length > 0) {
        const latestResult = recentMatches[0].result
        for (const match of recentMatches) {
          if (match.result === latestResult) {
            currentStreak++
          } else {
            break
          }
        }
        
        // 負の値は連敗、正の値は連勝、引分は0
        if (latestResult === 'loss') {
          currentStreak = -currentStreak
        } else if (latestResult === 'draw') {
          currentStreak = 0
        }
      }

      // 最高連勝記録を計算
      let bestWinStreak = 0
      let currentWinStreak = 0
      for (const match of matches) {
        if (match.result === 'win') {
          currentWinStreak++
          bestWinStreak = Math.max(bestWinStreak, currentWinStreak)
        } else {
          currentWinStreak = 0
        }
      }

      // 最悪連敗記録を計算
      let worstLossStreak = 0
      let currentLossStreak = 0
      for (const match of matches) {
        if (match.result === 'loss') {
          currentLossStreak++
          worstLossStreak = Math.max(worstLossStreak, currentLossStreak)
        } else {
          currentLossStreak = 0
        }
      }

      // 直近10試合の勝率を計算
      const recent10Matches = [...matches]
        .sort((a, b) => {
          const dateA = new Date(a.match_date).getTime()
          const dateB = new Date(b.match_date).getTime()
          if (dateA !== dateB) return dateB - dateA
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        .slice(0, 10)

      const recentWins = recent10Matches.filter(m => m.result === 'win').length
      const recentWinRate = recent10Matches.length > 0 ? (recentWins / recent10Matches.length) * 100 : 0

      return {
        totalMatches,
        wins,
        draws,
        losses,
        currentStreak,
        bestWinStreak,
        worstLossStreak,
        recentWinRate,
        matches: matches || [],
        totalPointsScored,
        totalPointsConceded,
        averagePointsScored,
        averagePointsConceded
      }
    }
  })

  // 期間別得失点データを取得
  const { data: periodScoringData } = useQuery({
    queryKey: ['teamScoringData', userId, opponentId, globalPeriod],
    queryFn: async () => {
      let query = supabase
        .from('matches')
        .select('user_score, opponent_score, match_date')
        .eq('user_id', userId)
        .eq('opponent_id', opponentId)
      
      const dateFilter = getDateFilter(globalPeriod)
      if (dateFilter) {
        query = query.gte('match_date', dateFilter)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data
    }
  })

  // 期間別得失点を計算
  const periodTotalPointsScored = periodScoringData ? periodScoringData.reduce((sum, match) => sum + match.user_score, 0) : 0
  const periodTotalPointsConceded = periodScoringData ? periodScoringData.reduce((sum, match) => sum + match.opponent_score, 0) : 0
  const periodAveragePointsScored = periodScoringData && periodScoringData.length > 0
    ? Number((periodTotalPointsScored / periodScoringData.length).toFixed(1))
    : 0
  const periodAveragePointsConceded = periodScoringData && periodScoringData.length > 0
    ? Number((periodTotalPointsConceded / periodScoringData.length).toFixed(1))
    : 0

  const getStreakText = (streak: number) => {
    if (streak === 0) return '記録なし'
    if (streak > 0) return `${streak}連勝中！`
    return `${Math.abs(streak)}連敗中...`
  }

  const getStreakIcon = (streak: number) => {
    const absStreak = Math.abs(streak)
    
    if (streak > 0) {
      // 連勝時は火のアイコン、連続数に応じて変化
      if (absStreak >= 20) return { icon: Zap, size: 'w-8 h-8' } // 20連勝以上：稲妻
      if (absStreak >= 10) return { icon: Flame, size: 'w-7 h-7' } // 10連勝以上：強火
      if (absStreak >= 5) return { icon: Flame, size: 'w-6 h-6' } // 5連勝以上：中火
      if (absStreak >= 3) return { icon: Flame, size: 'w-5 h-5' } // 3連勝以上：小さい火
      return { icon: Flame, size: 'w-4 h-4' } // 1連勝：小さな火
    } else if (streak < 0) {
      // 連敗時は雨のアイコン、連続数に応じて変化
      if (absStreak >= 20) return { icon: Wind, size: 'w-8 h-8' } // 20連敗以上：台風
      if (absStreak >= 10) return { icon: CloudLightning, size: 'w-7 h-7' } // 10連敗以上：雷雨
      if (absStreak >= 5) return { icon: CloudRain, size: 'w-6 h-6' } // 5連敗以上：強めの雨
      if (absStreak >= 3) return { icon: CloudRain, size: 'w-5 h-5' } // 3連敗以上：少し雨
      return { icon: Droplets, size: 'w-4 h-4' } // 1連敗：雨粒
    }
    
    return { icon: TrendingUp, size: 'w-6 h-6' }
  }

  const getStreakBackground = (streak: number) => {
    const absStreak = Math.abs(streak)
    
    if (streak > 0) {
      // 連勝時は明るい色、段階的に明るく
      if (absStreak >= 20) return 'bg-gradient-to-r from-yellow-300 to-orange-300'
      if (absStreak >= 10) return 'bg-gradient-to-r from-yellow-400 to-orange-400'
      if (absStreak >= 5) return 'bg-gradient-to-r from-yellow-500 to-orange-500'
      if (absStreak >= 3) return 'bg-gradient-to-r from-yellow-600 to-orange-600'
      return 'bg-orange-500'
    } else if (streak < 0) {
      // 連敗時は暗い色、段階的に暗く
      if (absStreak >= 20) return 'bg-gradient-to-r from-gray-700 to-slate-800'
      if (absStreak >= 10) return 'bg-gradient-to-r from-gray-600 to-slate-700'
      if (absStreak >= 5) return 'bg-gradient-to-r from-gray-500 to-slate-600'
      if (absStreak >= 3) return 'bg-gradient-to-r from-gray-400 to-slate-500'
      return 'bg-gray-500'
    }
    
    return 'bg-orange-500'
  }

  const winRate = teamStats && teamStats.totalMatches > 0 
    ? Math.round((teamStats.wins / teamStats.totalMatches) * 100)
    : 0

  if (!teamStats) {
    return <div className="text-center py-4">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      {/* チーム別統計カード */}
      <div className="space-y-4">
        {/* 勝率と得失点を2列で表示 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center bg-white border-gray-200 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {winRate}%
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">勝率</div>
              <div className="text-xs text-gray-500">
                直近10試合: {Math.round(teamStats.recentWinRate)}% | 総試合数: {teamStats.totalMatches}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <span className="text-green-600 font-medium">{teamStats.wins}勝</span> 
                <span className="text-gray-500 mx-1">{teamStats.draws}分</span> 
                <span className="text-red-500 font-medium">{teamStats.losses}敗</span>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-4 text-center">得失点</div>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{periodTotalPointsScored}</div>
                    <div className="text-xs text-gray-500">合計得点</div>
                  </div>
                  <div className="text-gray-400">-</div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600">{periodTotalPointsConceded}</div>
                    <div className="text-xs text-gray-500">合計失点</div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{periodAveragePointsScored}</div>
                      <div className="text-xs text-gray-500">平均得点</div>
                    </div>
                    <div className="text-gray-400">-</div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">{periodAveragePointsConceded}</div>
                      <div className="text-xs text-gray-500">平均失点</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>


      </div>

      {/* 勝率推移グラフ */}
      {teamStats.totalMatches > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                勝率推移グラフ
              </CardTitle>
              {/* 連勝連敗の表示 */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${getStreakBackground(teamStats.currentStreak)} rounded-full flex items-center justify-center`}>
                  {(() => {
                    const { icon: IconComponent, size } = getStreakIcon(teamStats.currentStreak)
                    return <IconComponent className={`${size} text-white`} />
                  })()}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {getStreakText(teamStats.currentStreak)}
                </span>
              </div>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <TeamWinRateChart matches={teamStats.matches} />
          </div>
        </Card>
      )}

    </div>
  )
}
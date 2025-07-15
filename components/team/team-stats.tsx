'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamWinRateChart } from './team-win-rate-chart'
import { Trophy, Target, TrendingUp, Users } from 'lucide-react'

interface TeamStatsProps {
  userId: string
  opponentId: string
  teamName: string
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
  matches: any[]
}

export function TeamStats({ userId, opponentId, teamName }: TeamStatsProps) {
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
          matches: []
        }
      }

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
        matches: matches || []
      }
    }
  })

  const getStreakText = (streak: number) => {
    if (streak === 0) return '記録なし'
    if (streak > 0) return `${streak}連勝中！`
    return `${Math.abs(streak)}連敗中...`
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              総試合数
            </CardTitle>
            <div className="text-2xl font-bold text-green-600">
              {teamStats.totalMatches}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-blue-600" />
              勝率
            </CardTitle>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {winRate}%
            </div>
            <div className="text-xs text-gray-500">
              直近10試合: {Math.round(teamStats.recentWinRate)}%
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              現在の記録
            </CardTitle>
            <div className="text-sm font-bold text-orange-600">
              {getStreakText(teamStats.currentStreak)}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              最高連勝
            </CardTitle>
            <div className="text-2xl font-bold text-purple-600">
              {teamStats.bestWinStreak}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* 勝率推移グラフ */}
      {teamStats.totalMatches > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              勝率推移グラフ
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <TeamWinRateChart matches={teamStats.matches} />
          </div>
        </Card>
      )}

      {/* 詳細統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            vs {teamName} 詳細統計
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{teamStats.wins}</div>
              <div className="text-sm text-gray-500">勝利</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{teamStats.draws}</div>
              <div className="text-sm text-gray-500">引分</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{teamStats.losses}</div>
              <div className="text-sm text-gray-500">敗北</div>
            </div>
          </div>
          
          {teamStats.totalMatches > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">最高連勝記録:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {teamStats.bestWinStreak}連勝
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">最悪連敗記録:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {teamStats.worstLossStreak}連敗
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
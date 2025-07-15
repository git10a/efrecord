'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Target, TrendingUp, Plus, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardProps {
  userId: string
}

export default function Dashboard({ userId }: DashboardProps) {
  const supabase = createClient()
  const router = useRouter()

  const { data: userStats } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      return data || {
        total_matches: 0,
        total_wins: 0,
        total_draws: 0,
        total_losses: 0,
        current_streak: 0,
        best_win_streak: 0,
        worst_loss_streak: 0,
        team_name: 'マイチーム'
      }
    }
  })

  const { data: recentMatches } = useQuery({
    queryKey: ['recentMatches', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          opponents(name)
        `)
        .eq('user_id', userId)
        .order('match_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) throw error
      return data
    }
  })

  // 直近10試合の勝率を計算
  const { data: recent10Matches } = useQuery({
    queryKey: ['recent10Matches', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('result')
        .eq('user_id', userId)
        .order('match_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return data
    }
  })

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-700 bg-green-100 border border-green-200'
      case 'draw': return 'text-gray-700 bg-gray-100 border border-gray-200'
      case 'loss': return 'text-red-700 bg-red-100 border border-red-200'
      default: return 'text-gray-700 bg-gray-100 border border-gray-200'
    }
  }

  const getResultText = (result: string) => {
    switch (result) {
      case 'win': return '勝利'
      case 'draw': return '引分'
      case 'loss': return '敗北'
      default: return '-'
    }
  }

  const getStreakText = (streak: number) => {
    if (streak === 0) return '記録なし'
    if (streak > 0) return `${streak}連勝中！`
    return `${Math.abs(streak)}連敗中...`
  }

  const winRate = userStats && userStats.total_matches > 0 
    ? Math.round((userStats.total_wins / userStats.total_matches) * 100)
    : 0

  const recent10WinRate = recent10Matches && recent10Matches.length > 0
    ? Math.round((recent10Matches.filter(m => m.result === 'win').length / recent10Matches.length) * 100)
    : 0

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ヘッダー */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴとタイトル */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                eF record
              </h1>
            </div>

            {/* ナビゲーションボタン */}
            <div className="flex items-center gap-2">
              {/* チーム名ボタン */}
              <Link href="/memos">
                <div className="h-9 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer transition-all duration-200 flex items-center shadow-sm">
                  {userStats?.team_name || 'マイチーム'}
                </div>
              </Link>

              {/* チーム管理ボタン */}
              <Link href="/teams">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50 shadow-sm transition-all duration-200"
                >
                  チーム管理
                </Button>
              </Link>

              {/* ログアウトボタン */}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleLogout}
                className="h-9 border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 hover:bg-red-50 shadow-sm transition-all duration-200 flex items-center"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">ログアウト</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center bg-white border-gray-200 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {userStats?.total_wins || 0}
              </div>
              <div className="text-sm font-medium text-gray-600">勝利数</div>
            </div>
          </Card>
          
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
                直近10試合: {recent10WinRate}%
              </div>
            </div>
          </Card>
          
          <Card className="text-center bg-white border-gray-200 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-lg font-bold text-gray-800 mb-1">
                {getStreakText(userStats?.current_streak || 0)}
              </div>
              <div className="text-sm font-medium text-gray-600">現在の連勝/連敗</div>
            </div>
          </Card>
          
          <Card className="text-center bg-white border-gray-200 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="text-white font-bold text-lg">試</div>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {userStats?.total_matches || 0}
              </div>
              <div className="text-sm font-medium text-gray-600">総試合数</div>
              <div className="text-xs text-gray-500 mt-2">
                <span className="text-green-600 font-medium">{userStats?.total_wins || 0}勝</span> 
                <span className="text-gray-500 mx-1">{userStats?.total_draws || 0}分</span> 
                <span className="text-red-500 font-medium">{userStats?.total_losses || 0}敗</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 最近の試合 */}
        <Card className="bg-white shadow-md">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-gray-800">
                最近の試合
              </CardTitle>
              <Link href="/matches/new">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  結果を記録する
                </Button>
              </Link>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            {recentMatches && recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200"
                    onClick={() => router.push(`/matches/${match.id}/edit`)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor(match.result)}`}
                      >
                        {getResultText(match.result)}
                      </span>
                      <span 
                        className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/matches?opponent=${match.opponent_id}`)
                        }}
                      >
                        vs {(match.opponents as { name: string })?.name || '不明'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {match.user_score} - {match.opponent_score}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(match.match_date).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="text-center py-8 text-gray-500">
                  まだ試合記録がありません
                  <div className="mt-4">
                    <Link href="/matches/new">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        最初の試合を記録する
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
            
            {recentMatches && recentMatches.length > 0 && (
              <div className="text-center pt-6 border-t border-gray-100">
                <Link href="/matches">
                  <Button variant="outline">
                    過去の戦績を見る
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
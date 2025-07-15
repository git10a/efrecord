'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PageLayout } from '@/components/layout/page-layout'
import { TeamStats } from '@/components/team/team-stats'
import { ChevronDown, History } from 'lucide-react'

interface Match {
  id: string
  user_score: number
  opponent_score: number
  result: string
  match_date: string
  memo: string | null
  opponents: { name: string }
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [opponentName, setOpponentName] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const opponentId = searchParams.get('opponent')

  useEffect(() => {
    fetchMatches(true)
  }, [opponentId])

  const fetchMatches = async (reset = false) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // userIdを保存
      if (reset) {
        setUserId(user.id)
      }

      const currentPage = reset ? 0 : page
      const offset = currentPage * 10

      let query = supabase
        .from('matches')
        .select(`
          *,
          opponents(name)
        `)
        .eq('user_id', user.id)
        .order('match_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + 9)

      if (opponentId) {
        query = query.eq('opponent_id', opponentId)
      }

      const { data, error } = await query

      if (error) throw error

      if (reset) {
        setMatches(data || [])
        setPage(1)
      } else {
        setMatches(prev => [...prev, ...(data || [])])
        setPage(prev => prev + 1)
      }

      setHasMore((data || []).length === 10)

      // 対戦相手名を取得
      if (opponentId && data && data.length > 0) {
        setOpponentName((data[0].opponents as any)?.name || '不明')
      }
    } catch (err) {
      console.error('Error fetching matches:', err)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <PageLayout title={opponentName ? `vs ${opponentName} の対戦履歴` : '過去の戦績'}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* チーム別統計（特定のチームが選択されている場合のみ表示） */}
        {opponentId && opponentName && userId && (
          <TeamStats 
            userId={userId}
            opponentId={opponentId}
            teamName={opponentName}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              {opponentName ? `vs ${opponentName}` : '全試合履歴'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map((match) => (
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
                      {!opponentName && (
                        <span className="font-medium">
                          vs {(match.opponents as any)?.name || '不明'}
                        </span>
                      )}
                      {match.memo && (
                        <span className="text-sm text-gray-500 truncate max-w-32">
                          {match.memo}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {match.user_score} - {match.opponent_score}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(match.match_date).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                ))}

                {/* もっと読み込むボタン */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchMatches(false)}
                      disabled={loading}
                    >
                      {loading ? (
                        '読み込み中...'
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          さらに表示
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {loading ? '読み込み中...' : '試合記録がありません'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
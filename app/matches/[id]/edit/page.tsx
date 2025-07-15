'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PageLayout } from '@/components/layout/page-layout'
import { GridScoreInput } from '@/components/ui/grid-score-input'
import { Edit } from 'lucide-react'

interface Opponent {
  id: string
  name: string
}

interface Match {
  id: string
  user_score: number
  opponent_score: number
  memo: string | null
  opponent_id: string
  opponents: { name: string }
}

export default function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const [match, setMatch] = useState<Match | null>(null)
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [selectedOpponentId, setSelectedOpponentId] = useState('')
  const [userScore, setUserScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [matchId, setMatchId] = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    params.then(resolvedParams => {
      setMatchId(resolvedParams.id)
    })
  }, [params])

  useEffect(() => {
    if (matchId) {
      fetchMatch()
      fetchOpponents()
    }
  }, [matchId, fetchMatch])

  const fetchMatch = useCallback(async () => {
    if (!matchId) return
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          opponents(name)
        `)
        .eq('id', matchId)
        .single()

      if (error) throw error

      setMatch(data)
      setSelectedOpponentId(data.opponent_id)
      setUserScore(data.user_score)
      setOpponentScore(data.opponent_score)
      setMemo(data.memo || '')
    } catch (err) {
      console.error('Error fetching match:', err)
      setError('試合データの取得に失敗しました')
    }
  }, [matchId])

  const fetchOpponents = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('opponents')
        .select('id, name')
        .order('name')

      if (error) throw error
      setOpponents(data || [])
    } catch (err) {
      console.error('Error fetching opponents:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedOpponentId) {
      setError('対戦相手を選択してください')
      return
    }

    if (userScore < 0 || opponentScore < 0) {
      setError('スコアは0以上で入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error } = await supabase
        .from('matches')
        .update({
          opponent_id: selectedOpponentId,
          user_score: userScore,
          opponent_score: opponentScore,
          memo: memo.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('user_id', user.id)

      if (error) throw error

      // React Queryのキャッシュを無効化してダッシュボードのデータを最新に更新
      await queryClient.invalidateQueries({ queryKey: ['userStats', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['recentMatches', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['recent10Matches', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['teamStats', user.id] })
      
      router.push('/')
    } catch (err) {
      console.error('Error updating match:', err)
      setError('試合記録の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('この試合記録を削除しますか？')) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', params.id)
        .eq('user_id', user.id)

      if (error) throw error

      // React Queryのキャッシュを無効化してダッシュボードのデータを最新に更新
      await queryClient.invalidateQueries({ queryKey: ['userStats', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['recentMatches', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['recent10Matches', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['teamStats', user.id] })
      
      router.push('/')
    } catch (err) {
      console.error('Error deleting match:', err)
      setError('試合記録の削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!match) {
    return (
      <PageLayout title="読み込み中..." showBack={false}>
        <div className="max-w-md mx-auto text-center">
          <div>読み込み中...</div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="試合記録を編集">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              試合記録を編集
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  対戦相手 *
                </label>
                <select
                  value={selectedOpponentId}
                  onChange={(e) => setSelectedOpponentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">対戦相手を選択</option>
                  {opponents.map((opponent) => (
                    <option key={opponent.id} value={opponent.id}>
                      {opponent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GridScoreInput
                  label="自分のスコア"
                  value={userScore}
                  onChange={setUserScore}
                />
                <GridScoreInput
                  label="相手のスコア"
                  value={opponentScore}
                  onChange={setOpponentScore}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メモ
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="試合のメモ（任意）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1"
                >
                  削除
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? '更新中...' : '更新'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
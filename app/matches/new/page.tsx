'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PageLayout } from '@/components/layout/page-layout'
import { GridScoreInput } from '@/components/ui/grid-score-input'
import { Plus } from 'lucide-react'

interface Opponent {
  id: string
  name: string
}

export default function NewMatchPage() {
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [selectedOpponentId, setSelectedOpponentId] = useState('')
  const [userScore, setUserScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const queryClient = useQueryClient()

  const fetchOpponents = useCallback(async () => {
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
      setError('対戦相手の取得に失敗しました')
    }
  }, [])

  useEffect(() => {
    fetchOpponents()
  }, [fetchOpponents])

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

      // 結果を計算
      let result = 'draw'
      if (userScore > opponentScore) result = 'win'
      else if (userScore < opponentScore) result = 'loss'

      // 試合記録を作成
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          user_id: user.id,
          opponent_id: selectedOpponentId,
          user_score: userScore,
          opponent_score: opponentScore,
          result: result,
          memo: memo.trim() || null,
          match_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (matchError) throw matchError

      // React Queryのキャッシュを無効化してダッシュボードのデータを最新に更新
      await queryClient.invalidateQueries({ queryKey: ['userStats', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['recentMatches', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['recent10Matches', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['teamStats', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['scoringData', user.id] })
      
      router.push('/')
    } catch (err) {
      console.error('Error creating match:', err)
      setError('試合記録の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout title="新しい試合記録を追加">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              試合記録を追加
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
                  <option value="" className="text-gray-900">対戦相手を選択</option>
                  {opponents.map((opponent) => (
                    <option key={opponent.id} value={opponent.id} className="text-gray-900">
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
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? '保存中...' : '保存'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PageLayout } from '@/components/layout/page-layout'
import { GridScoreInput } from '@/components/ui/grid-score-input'
import { Plus, Target } from 'lucide-react'

interface Opponent {
  id: string
  name: string
}

interface Player {
  id: string
  name: string
  position: 'GK' | 'DF' | 'MF' | 'FW'
  number: number | null
}

interface FormationPosition {
  id: string
  player_id: string
  position_x: number
  position_y: number
  display_position: string
  player: Player
}

interface Formation {
  id: string
  name: string
  formation_pattern: string
  is_default: boolean
}

interface GoalRecord {
  player_id: string
  player_name: string
  count: number
}

export default function NewMatchPage() {
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [selectedOpponentId, setSelectedOpponentId] = useState('')
  const [userScore, setUserScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // フォーメーション関連
  const [formations, setFormations] = useState<Formation[]>([])
  const [currentFormation, setCurrentFormation] = useState<Formation | null>(null)
  const [formationPositions, setFormationPositions] = useState<FormationPosition[]>([])
  const [goalRecords, setGoalRecords] = useState<GoalRecord[]>([])
  
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    fetchOpponents()
    fetchFormations()
  }, [])

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
      setError('対戦相手の取得に失敗しました')
    }
  }

  const fetchFormations = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // フォーメーションを取得
      const { data: formationsData, error: formationsError } = await supabase
        .from('formations')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default DESC, name')

      if (formationsError) throw formationsError

      setFormations(formationsData || [])

      // デフォルトフォーメーションを選択
      const defaultFormation = formationsData?.find(f => f.is_default) || formationsData?.[0]
      if (defaultFormation) {
        setCurrentFormation(defaultFormation)
        await fetchFormationPositions(defaultFormation.id)
      }
    } catch (err) {
      console.error('Error fetching formations:', err)
      setError('フォーメーションの取得に失敗しました')
    }
  }

  const fetchFormationPositions = async (formationId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('formation_positions')
        .select(`
          *,
          player:players(*)
        `)
        .eq('formation_id', formationId)

      if (error) throw error
      setFormationPositions(data || [])
    } catch (err) {
      console.error('Error fetching formation positions:', err)
      setError('フォーメーション配置の取得に失敗しました')
    }
  }

  const handleFormationChange = async (formationId: string) => {
    const formation = formations.find(f => f.id === formationId)
    if (formation) {
      setCurrentFormation(formation)
      await fetchFormationPositions(formationId)
    }
  }

  const handlePlayerGoal = (playerId: string, playerName: string) => {
    setGoalRecords(prev => {
      const existing = prev.find(record => record.player_id === playerId)
      if (existing) {
        return prev.map(record => 
          record.player_id === playerId 
            ? { ...record, count: record.count + 1 }
            : record
        )
      } else {
        return [...prev, { player_id: playerId, player_name: playerName, count: 1 }]
      }
    })
    
    // 総得点も更新
    setUserScore(prev => prev + 1)
  }

  const handleRemoveGoal = (playerId: string) => {
    setGoalRecords(prev => {
      const existing = prev.find(record => record.player_id === playerId)
      if (existing && existing.count > 1) {
        return prev.map(record => 
          record.player_id === playerId 
            ? { ...record, count: record.count - 1 }
            : record
        )
      } else {
        return prev.filter(record => record.player_id !== playerId)
      }
    })
    
    // 総得点も更新
    setUserScore(prev => Math.max(0, prev - 1))
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

      // 試合記録を作成
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          user_id: user.id,
          opponent_id: selectedOpponentId,
          user_score: userScore,
          opponent_score: opponentScore,
          memo: memo.trim() || null
        })
        .select()
        .single()

      if (matchError) throw matchError

      // 得点記録を作成
      if (goalRecords.length > 0 && matchData) {
        const goalInserts = goalRecords.flatMap(record => 
          Array.from({ length: record.count }, () => ({
            match_id: matchData.id,
            player_id: record.player_id
          }))
        )

        const { error: goalsError } = await supabase
          .from('match_goals')
          .insert(goalInserts)

        if (goalsError) throw goalsError
      }

      // React Queryのキャッシュを無効化してダッシュボードのデータを最新に更新
      await queryClient.invalidateQueries({ queryKey: ['userStats', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['recentMatches', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['recent10Matches', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['teamStats', user.id] })
      
      router.push('/')
    } catch (err) {
      console.error('Error creating match:', err)
      setError('試合記録の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout title="試合記録を追加">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側: 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                試合情報
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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

          {/* 右側: フォーメーションと得点記録 */}
          <div className="space-y-6">
            {/* フォーメーション選択 */}
            {formations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>フォーメーション</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    value={currentFormation?.id || ''}
                    onChange={(e) => handleFormationChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {formations.map((formation) => (
                      <option key={formation.id} value={formation.id}>
                        {formation.name} ({formation.formation_pattern})
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )}

            {/* フォーメーション表示 */}
            {currentFormation && formationPositions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    得点記録（選手をクリック）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-64 bg-green-600 rounded-lg overflow-hidden mb-4">
                    {/* ピッチのライン */}
                    <div className="absolute inset-0 border-2 border-white opacity-30"></div>
                    <div className="absolute top-1/2 left-0 right-0 border-t border-white opacity-30"></div>
                    <div className="absolute left-1/4 top-0 bottom-0 border-l border-white opacity-30"></div>
                    <div className="absolute right-1/4 top-0 bottom-0 border-l border-white opacity-30"></div>
                    
                    {/* 選手カード */}
                    {formationPositions.map((position) => {
                      const goalCount = goalRecords.find(record => record.player_id === position.player_id)?.count || 0
                      return (
                        <div
                          key={position.id}
                          className="absolute w-14 h-14 bg-white border-2 border-gray-300 rounded-lg shadow-md cursor-pointer hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-xs"
                          style={{
                            left: `${position.position_x}%`,
                            top: `${position.position_y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          onClick={() => handlePlayerGoal(position.player_id, position.player.name)}
                        >
                          <div className="font-bold text-xs">{position.player.name}</div>
                          <div className="text-gray-500 text-xs">{position.display_position}</div>
                          {goalCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {goalCount}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* 得点記録一覧 */}
                  {goalRecords.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">得点記録</h4>
                      {goalRecords.map((record) => (
                        <div key={record.player_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{record.player_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{record.count}点</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveGoal(record.player_id)}
                              className="w-6 h-6 p-0"
                            >
                              -
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Draggable from 'react-draggable'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageLayout } from '@/components/layout/page-layout'
import { Plus, Edit2, Trash2 } from 'lucide-react'

interface Player {
  id: string
  name: string
  position: 'GK' | 'DF' | 'MF' | 'FW'
  number: number | null
  is_active: boolean
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

export default function FormationPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [formations, setFormations] = useState<Formation[]>([])
  const [currentFormation, setCurrentFormation] = useState<Formation | null>(null)
  const [formationPositions, setFormationPositions] = useState<FormationPosition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 選手管理
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [newPlayer, setNewPlayer] = useState({ name: '', position: 'DF', number: '' })
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  
  // フォーメーション管理
  const [showAddFormation, setShowAddFormation] = useState(false)
  const [newFormation, setNewFormation] = useState({ name: '', formation_pattern: '4-4-2' })
  
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // 選手を取得
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('position, name')

      if (playersError) throw playersError

      // フォーメーションを取得
      const { data: formationsData, error: formationsError } = await supabase
        .from('formations')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default DESC, name')

      if (formationsError) throw formationsError

      setPlayers(playersData || [])
      setFormations(formationsData || [])

      // デフォルトフォーメーションを選択
      const defaultFormation = formationsData?.find(f => f.is_default) || formationsData?.[0]
      if (defaultFormation) {
        setCurrentFormation(defaultFormation)
        await fetchFormationPositions(defaultFormation.id)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      setError(`データの取得に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
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

  const handleAddPlayer = async () => {
    if (!newPlayer.name.trim()) {
      setError('選手名を入力してください')
      return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from('players')
        .insert({
          user_id: user.id,
          name: newPlayer.name.trim(),
          position: newPlayer.position,
          number: newPlayer.number ? parseInt(newPlayer.number) : null
        })

      if (error) throw error

      setNewPlayer({ name: '', position: 'DF', number: '' })
      setShowAddPlayer(false)
      fetchData()
    } catch (err) {
      console.error('Error adding player:', err)
      setError('選手の追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlayer = async () => {
    if (!editingPlayer || !editingPlayer.name.trim()) {
      setError('選手名を入力してください')
      return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('players')
        .update({
          name: editingPlayer.name.trim(),
          position: editingPlayer.position,
          number: editingPlayer.number
        })
        .eq('id', editingPlayer.id)

      if (error) throw error

      setEditingPlayer(null)
      fetchData()
    } catch (err) {
      console.error('Error updating player:', err)
      setError('選手の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('この選手を削除しますか？')) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('id', playerId)

      if (error) throw error

      fetchData()
    } catch (err) {
      console.error('Error deleting player:', err)
      setError('選手の削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFormation = async () => {
    if (!newFormation.name.trim()) {
      setError('フォーメーション名を入力してください')
      return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data, error } = await supabase
        .from('formations')
        .insert({
          user_id: user.id,
          name: newFormation.name.trim(),
          formation_pattern: newFormation.formation_pattern
        })
        .select()
        .single()

      if (error) throw error

      setNewFormation({ name: '', formation_pattern: '4-4-2' })
      setShowAddFormation(false)
      fetchData()
      
      // 新しいフォーメーションを選択
      if (data) {
        setCurrentFormation(data)
        await fetchFormationPositions(data.id)
      }
    } catch (err) {
      console.error('Error adding formation:', err)
      setError('フォーメーションの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleFormationChange = async (formationId: string) => {
    const formation = formations.find(f => f.id === formationId)
    if (formation) {
      setCurrentFormation(formation)
      await fetchFormationPositions(formationId)
    }
  }

  const handlePositionUpdate = async (positionId: string, x: number, y: number) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('formation_positions')
        .update({
          position_x: Math.max(0, Math.min(100, x)),
          position_y: Math.max(0, Math.min(100, y))
        })
        .eq('id', positionId)

      if (error) throw error
    } catch (err) {
      console.error('Error updating position:', err)
      setError('位置の更新に失敗しました')
    }
  }

  const handlePlayerClick = async (playerId: string) => {
    if (!currentFormation) return

    try {
      const supabase = createClient()
      const player = players.find(p => p.id === playerId)
      if (!player) return

      // 既存の配置を確認
      const existingPosition = formationPositions.find(fp => fp.player_id === playerId)
      
      if (existingPosition) {
        // 既に配置されている場合は削除
        const { error } = await supabase
          .from('formation_positions')
          .delete()
          .eq('id', existingPosition.id)

        if (error) throw error
        setFormationPositions(prev => prev.filter(fp => fp.id !== existingPosition.id))
      } else {
        // 新しい配置を追加（中央に配置）
        const { data, error } = await supabase
          .from('formation_positions')
          .insert({
            formation_id: currentFormation.id,
            player_id: playerId,
            position_x: 50,
            position_y: 50,
            display_position: player.position
          })
          .select(`
            *,
            player:players(*)
          `)
          .single()

        if (error) throw error
        setFormationPositions(prev => [...prev, data])
      }
    } catch (err) {
      console.error('Error toggling player position:', err)
      setError('選手配置の更新に失敗しました')
    }
  }

  return (
    <PageLayout title="フォーメーション管理">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-6">
          {/* 左側: 選手管理 */}
          <div className="w-1/3">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>選手管理</span>
                  <Button
                    size="sm"
                    onClick={() => setShowAddPlayer(true)}
                    disabled={showAddPlayer}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    選手追加
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showAddPlayer && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="space-y-3">
                      <Input
                        placeholder="選手名"
                        value={newPlayer.name}
                        onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                      />
                                             <Select
                         value={newPlayer.position}
                         onChange={(e) => setNewPlayer(prev => ({ ...prev, position: e.target.value as 'GK' | 'DF' | 'MF' | 'FW' }))}
                         options={[
                           { value: 'GK', label: 'GK' },
                           { value: 'DF', label: 'DF' },
                           { value: 'MF', label: 'MF' },
                           { value: 'FW', label: 'FW' }
                         ]}
                       />
                      <Input
                        placeholder="背番号（任意）"
                        type="number"
                        value={newPlayer.number}
                        onChange={(e) => setNewPlayer(prev => ({ ...prev, number: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddPlayer} disabled={loading}>
                          追加
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAddPlayer(false)}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formationPositions.some(fp => fp.player_id === player.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePlayerClick(player.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-gray-500">
                            {player.position} {player.number && `#${player.number}`}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingPlayer(player)
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePlayer(player.id)
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* フォーメーション選択 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>フォーメーション</span>
                  <Button
                    size="sm"
                    onClick={() => setShowAddFormation(true)}
                    disabled={showAddFormation}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    追加
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showAddFormation && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="space-y-3">
                      <Input
                        placeholder="フォーメーション名"
                        value={newFormation.name}
                        onChange={(e) => setNewFormation(prev => ({ ...prev, name: e.target.value }))}
                      />
                                             <Select
                         value={newFormation.formation_pattern}
                         onChange={(e) => setNewFormation(prev => ({ ...prev, formation_pattern: e.target.value }))}
                         options={[
                           { value: '4-4-2', label: '4-4-2' },
                           { value: '4-3-3', label: '4-3-3' },
                           { value: '3-5-2', label: '3-5-2' },
                           { value: '4-2-3-1', label: '4-2-3-1' },
                           { value: '3-4-3', label: '3-4-3' }
                         ]}
                       />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddFormation} disabled={loading}>
                          追加
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAddFormation(false)}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {formations.map((formation) => (
                    <div
                      key={formation.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        currentFormation?.id === formation.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleFormationChange(formation.id)}
                    >
                      <div className="font-medium">{formation.name}</div>
                      <div className="text-sm text-gray-500">{formation.formation_pattern}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側: フォーメーション表示 */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentFormation ? `${currentFormation.name} (${currentFormation.formation_pattern})` : 'フォーメーション'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-96 bg-green-600 rounded-lg overflow-hidden">
                  {/* ピッチのライン */}
                  <div className="absolute inset-0 border-2 border-white opacity-30"></div>
                  <div className="absolute top-1/2 left-0 right-0 border-t border-white opacity-30"></div>
                  <div className="absolute left-1/4 top-0 bottom-0 border-l border-white opacity-30"></div>
                  <div className="absolute right-1/4 top-0 bottom-0 border-l border-white opacity-30"></div>
                  
                  {/* 選手カード */}
                  {formationPositions.map((position) => (
                    <Draggable
                      key={position.id}
                      defaultPosition={{ x: position.position_x, y: position.position_y }}
                      bounds="parent"
                      onStop={(e, data) => {
                        handlePositionUpdate(position.id, data.x, data.y)
                      }}
                    >
                      <div className="absolute w-16 h-16 bg-white border-2 border-gray-300 rounded-lg shadow-md cursor-move flex flex-col items-center justify-center text-xs">
                        <div className="font-bold">{position.player.name}</div>
                        <div className="text-gray-500">{position.display_position}</div>
                      </div>
                    </Draggable>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 選手編集モーダル */}
        {editingPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">選手編集</h3>
              <div className="space-y-3">
                <Input
                  placeholder="選手名"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
                                 <Select
                   value={editingPlayer.position}
                   onChange={(e) => setEditingPlayer(prev => prev ? { ...prev, position: e.target.value as 'GK' | 'DF' | 'MF' | 'FW' } : null)}
                   options={[
                     { value: 'GK', label: 'GK' },
                     { value: 'DF', label: 'DF' },
                     { value: 'MF', label: 'MF' },
                     { value: 'FW', label: 'FW' }
                   ]}
                 />
                <Input
                  placeholder="背番号（任意）"
                  type="number"
                  value={editingPlayer.number || ''}
                  onChange={(e) => setEditingPlayer(prev => prev ? { ...prev, number: e.target.value ? parseInt(e.target.value) : null } : null)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleUpdatePlayer} disabled={loading}>
                    更新
                  </Button>
                  <Button variant="outline" onClick={() => setEditingPlayer(null)}>
                    キャンセル
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
} 
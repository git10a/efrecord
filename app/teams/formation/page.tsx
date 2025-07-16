'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Draggableのimportを削除し、dnd-kitを追加
// import Draggable from 'react-draggable'
import {
  DndContext,
  useDraggable,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core'
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

// フォーメーションごとの初期配置パターンを定義
const FORMATION_PATTERNS: Record<string, Array<{ x: number, y: number, display_position: string }>> = {
  '4-4-2': [
    // GK
    { x: 200, y: 340, display_position: 'GK' },
    // DF
    { x: 60, y: 250, display_position: 'DF' },
    { x: 140, y: 250, display_position: 'DF' },
    { x: 260, y: 250, display_position: 'DF' },
    { x: 340, y: 250, display_position: 'DF' },
    // MF
    { x: 60, y: 150, display_position: 'MF' },
    { x: 140, y: 150, display_position: 'MF' },
    { x: 260, y: 150, display_position: 'MF' },
    { x: 340, y: 150, display_position: 'MF' },
    // FW
    { x: 140, y: 60, display_position: 'FW' },
    { x: 260, y: 60, display_position: 'FW' },
  ],
  '4-3-3': [
    // GK
    { x: 200, y: 340, display_position: 'GK' },
    // DF
    { x: 60, y: 250, display_position: 'DF' },
    { x: 140, y: 250, display_position: 'DF' },
    { x: 260, y: 250, display_position: 'DF' },
    { x: 340, y: 250, display_position: 'DF' },
    // MF
    { x: 100, y: 150, display_position: 'MF' },
    { x: 200, y: 150, display_position: 'MF' },
    { x: 300, y: 150, display_position: 'MF' },
    // FW
    { x: 60, y: 60, display_position: 'FW' },
    { x: 200, y: 60, display_position: 'FW' },
    { x: 340, y: 60, display_position: 'FW' },
  ],
  // 必要に応じて他のパターンも追加
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
  
  // 選手割り当て用の状態
  const [selectedPosition, setSelectedPosition] = useState<{ x: number, y: number, display_position: string } | null>(null)
  const [showPlayerAssignment, setShowPlayerAssignment] = useState(false)
  
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
        .order('is_default', { ascending: false })
        .order('name')

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
      // フォーメーション名が空の場合は自動生成
      const defaultName = `フォーメーション${formations.length + 1}`
      setNewFormation(prev => ({ ...prev, name: defaultName }))
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const formationName = newFormation.name.trim() || `フォーメーション${formations.length + 1}`
      const { data, error } = await supabase
        .from('formations')
        .insert({
          user_id: user.id,
          name: formationName,
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
    try {
      const supabase = createClient()
      
      // 新しいフォーメーションを取得
      const { data: newFormation, error: formationError } = await supabase
        .from('formations')
        .select('*')
        .eq('id', formationId)
        .single()

      if (formationError) throw formationError

      setCurrentFormation(newFormation)

      // 既存の選手割り当てを取得
      const { data: existingPositions, error: positionsError } = await supabase
        .from('formation_positions')
        .select(`
          *,
          player:players(*)
        `)
        .eq('formation_id', formationId)

      if (positionsError) throw positionsError

      // 新しいフォーメーションパターンを取得
      const newPattern = FORMATION_PATTERNS[newFormation.formation_pattern]
      if (!newPattern) {
        setFormationPositions(existingPositions || [])
        return
      }

      // 既存の割り当てを新しいパターンに再配置
      const reassignedPositions = []
      const usedPositions = new Set()

      // まず、同じポジション（GK, DF, MF, FW）の選手をできるだけ同じポジションに配置
      for (const existingPos of (existingPositions || [])) {
        const matchingNewPos = newPattern.find((pos, idx) => 
          pos.display_position === existingPos.display_position && 
          !usedPositions.has(idx)
        )

        if (matchingNewPos) {
          // 同じポジションの位置に配置
          reassignedPositions.push({
            ...existingPos,
            position_x: matchingNewPos.x,
            position_y: matchingNewPos.y,
            display_position: matchingNewPos.display_position
          })
          usedPositions.add(newPattern.indexOf(matchingNewPos))
        } else {
          // 同じポジションの位置がない場合は、空いている位置に配置
          const availablePos = newPattern.find((pos, idx) => !usedPositions.has(idx))
          if (availablePos) {
            reassignedPositions.push({
              ...existingPos,
              position_x: availablePos.x,
              position_y: availablePos.y,
              display_position: availablePos.display_position
            })
            usedPositions.add(newPattern.indexOf(availablePos))
          }
        }
      }

      // データベースを更新
      if (reassignedPositions.length > 0) {
        // 既存の割り当てを削除
        await supabase
          .from('formation_positions')
          .delete()
          .eq('formation_id', formationId)

        // 新しい割り当てを追加
        const { error: insertError } = await supabase
          .from('formation_positions')
          .insert(reassignedPositions.map(pos => ({
            formation_id: formationId,
            player_id: pos.player_id,
            position_x: pos.position_x,
            position_y: pos.position_y,
            display_position: pos.display_position
          })))

        if (insertError) throw insertError
      }

      // 更新された割り当てを取得
      await fetchFormationPositions(formationId)
    } catch (err) {
      console.error('Error changing formation:', err)
      setError('フォーメーションの変更に失敗しました')
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

  // dnd-kit用のドラッグ可能な選手カードコンポーネントを追加
  function DraggablePlayerCard({ position }: {
    position: FormationPosition
  }) {
    // dnd-kitのuseDraggableフックを使う
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: position.id,
      data: {
        x: position.position_x,
        y: position.position_y,
      },
    })
    // transformで現在の位置を反映
    const style = {
      position: 'absolute' as const,
      left: position.position_x,
      top: position.position_y,
      transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      width: '4rem',
      height: '4rem',
      background: 'white',
      border: '2px solid #d1d5db',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
      cursor: 'grab',
      zIndex: 10,
    }
    return (
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <div className="font-bold">{position.player.name}</div>
        <div className="text-gray-500">{position.display_position}</div>
      </div>
    )
  }

  // ドラッグ終了時の処理を追加
  type DragEndEventType = DragEndEvent & { active: { id: string }, delta: { x: number, y: number } }
  function handleDragEnd(event: DragEndEventType) {
    const { active, delta } = event
    // 対象のpositionを探す
    const pos = formationPositions.find(p => p.id === active.id)
    if (!pos) return
    // 新しい位置を計算
    const newX = pos.position_x + (delta?.x || 0)
    const newY = pos.position_y + (delta?.y || 0)
    // 位置を更新
    handlePositionUpdate(pos.id, newX, newY)
  }

  // 選手割り当て処理を追加
  const handleAssignPlayer = async (playerId: string) => {
    if (!selectedPosition || !currentFormation) return
    
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // 既存の同じ位置の割り当てを削除
      await supabase
        .from('formation_positions')
        .delete()
        .eq('formation_id', currentFormation.id)
        .eq('position_x', selectedPosition.x)
        .eq('position_y', selectedPosition.y)

      // 新しい割り当てを追加
      const { error } = await supabase
        .from('formation_positions')
        .insert({
          formation_id: currentFormation.id,
          player_id: playerId,
          position_x: selectedPosition.x,
          position_y: selectedPosition.y,
          display_position: selectedPosition.display_position
        })

      if (error) throw error

      setSelectedPosition(null)
      setShowPlayerAssignment(false)
      await fetchFormationPositions(currentFormation.id)
    } catch (err) {
      console.error('Error assigning player:', err)
      setError('選手の割り当てに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 未割り当て選手を取得
  const getUnassignedPlayers = () => {
    const assignedPlayerIds = formationPositions.map(fp => fp.player_id)
    return players.filter(player => !assignedPlayerIds.includes(player.id))
  }

  // 空カードのクリック処理を追加
  const handleEmptyCardClick = (position: { x: number, y: number, display_position: string }) => {
    setSelectedPosition(position)
    setShowPlayerAssignment(true)
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
                {/* dnd-kitのDndContextで囲む */}
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="relative w-full h-96 bg-green-600 rounded-lg overflow-hidden">
                    {/* ピッチのライン */}
                    <div className="absolute inset-0 border-2 border-white opacity-30"></div>
                    <div className="absolute top-1/2 left-0 right-0 border-t border-white opacity-30"></div>
                    <div className="absolute left-1/4 top-0 bottom-0 border-l border-white opacity-30"></div>
                    <div className="absolute right-1/4 top-0 bottom-0 border-l border-white opacity-30"></div>
                    {/* フォーメーションパターンに従って空カードを表示 */}
                    {currentFormation && FORMATION_PATTERNS[currentFormation.formation_pattern] &&
                      FORMATION_PATTERNS[currentFormation.formation_pattern].map((pos, idx) => {
                        // 既に割り当てられているかチェック
                        const assignedPosition = formationPositions.find(fp => 
                          fp.position_x === pos.x && fp.position_y === pos.y
                        )
                        
                        if (assignedPosition) {
                          // 既に割り当てられている場合は、その選手を表示
                          return (
                            <DraggablePlayerCard
                              key={assignedPosition.id}
                              position={assignedPosition}
                            />
                          )
                        } else {
                          // 空のカードを表示（クリック可能）
                          return (
                            <div
                              key={`empty-${idx}`}
                              onClick={() => handleEmptyCardClick(pos)}
                              style={{
                                position: 'absolute',
                                left: pos.x,
                                top: pos.y,
                                width: '4rem',
                                height: '4rem',
                                background: 'white',
                                border: '2px dashed #d1d5db',
                                borderRadius: '0.5rem',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                zIndex: 10,
                                cursor: 'pointer',
                              }}
                              className="hover:border-blue-400 hover:bg-blue-50 transition-colors"
                            >
                              <div className="font-bold text-gray-400">+</div>
                              <div className="text-gray-400">{pos.display_position}</div>
                            </div>
                          )
                        }
                      })
                    }
                    {/* 既存のformationPositionsの表示を削除（上記で統合済み） */}
                    {/* {formationPositions.length > 0 && formationPositions.map((position) => (
                      <DraggablePlayerCard
                        key={position.id}
                        position={position}
                        onPositionUpdate={handlePositionUpdate}
                      />
                    ))} */}
                  </div>
                </DndContext>
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

        {showPlayerAssignment && selectedPosition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">
                {selectedPosition.display_position} に選手を割り当て
              </h3>
              <div className="space-y-2">
                {getUnassignedPlayers().map((player) => (
                  <div
                    key={player.id}
                    className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    onClick={() => handleAssignPlayer(player.id)}
                  >
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-gray-500">
                      {player.position} {player.number && `#${player.number}`}
                    </div>
                  </div>
                ))}
                {getUnassignedPlayers().length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    割り当て可能な選手がいません
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPosition(null)
                    setShowPlayerAssignment(false)
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
} 
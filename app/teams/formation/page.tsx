// This file has been deleted as per user request

interface Player {
  id: string
  name: string
  position: 'GK' | 'DF' | 'MF' | 'FW' // データベースとの互換性のため保持するが、UIでは使用しない
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
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '' })
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  
  // フォーメーション管理
  const [showAddFormation, setShowAddFormation] = useState(false)
  const [newFormation, setNewFormation] = useState({ name: '', formation_pattern: '4-4-2' })
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null)
  
  // 選手割り当て用の状態
  const [selectedPosition, setSelectedPosition] = useState<{ x: number, y: number, display_position: string } | null>(null)
  const [showPlayerAssignment, setShowPlayerAssignment] = useState(false)
  
  // ドラッグ&ドロップ用の状態
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedPlayer, setDraggedPlayer] = useState<FormationPosition | null>(null)
  
  // デバウンス用のタイマー
  const [updateTimer, setUpdateTimer] = useState<NodeJS.Timeout | null>(null)
  
  // センサーの設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        // タッチデバイスでは長押しでドラッグ開始
        delay: typeof window !== 'undefined' && 'ontouchstart' in window ? 250 : 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const router = useRouter()

  const fetchData = useCallback(async () => {
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
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (updateTimer) {
        clearTimeout(updateTimer)
      }
    }
  }, [updateTimer])

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

      const { data: insertedPlayer, error } = await supabase
        .from('players')
        .insert({
          user_id: user.id,
          name: newPlayer.name.trim(),
          position: 'FW', // デフォルトとしてFWを設定（データベース制約のため）
          number: newPlayer.number ? parseInt(newPlayer.number) : null
        })
        .select()
        .single()

      if (error) throw error

      // 選手データを更新
      await fetchData()
      
      // 選手割り当てモードの場合、自動的に割り当て
      if (selectedPosition && currentFormation && insertedPlayer) {
        await handleAssignPlayer(insertedPlayer.id)
      }
      // 通常の選手追加でフィールドが満員の場合、自動的にベンチに追加
      else if (currentFormation && insertedPlayer && getFieldPlayers().length >= 11) {
        await handleAddToBench(insertedPlayer.id)
      }

      setNewPlayer({ name: '', number: '' })
      setShowAddPlayer(false)
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

  const handleUpdateFormation = async () => {
    if (!editingFormation || !editingFormation.name.trim()) {
      setError('フォーメーション名を入力してください')
      return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('formations')
        .update({
          name: editingFormation.name.trim()
        })
        .eq('id', editingFormation.id)

      if (error) throw error

      setEditingFormation(null)
      fetchData()
    } catch (err) {
      console.error('Error updating formation:', err)
      setError('フォーメーションの更新に失敗しました')
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

  const handlePositionUpdate = (positionId: string, x: number, y: number) => {
    // ピッチサイズに合わせて座標を制限し、整数に変換
    const clampedX = Math.round(Math.max(0, Math.min(336, x))) // 400 - 64 (カードサイズ)
    const clampedY = Math.round(Math.max(0, Math.min(320, y))) // 384 - 64 (カードサイズ)
    
    // 即座にローカル状態を更新（リアルタイム表示）
    setFormationPositions(prev => 
      prev.map(fp => 
        fp.id === positionId 
          ? { ...fp, position_x: clampedX, position_y: clampedY }
          : fp
      )
    )
    
    // 既存のタイマーをクリア
    if (updateTimer) {
      clearTimeout(updateTimer)
    }
    
    // 500ms後にデータベースを更新（デバウンス）
    const newTimer = setTimeout(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('formation_positions')
          .update({
            position_x: clampedX,
            position_y: clampedY
          })
          .eq('id', positionId)

        if (error) throw error
      } catch (err) {
        console.error('Error updating position:', err)
        setError('位置の更新に失敗しました')
        // エラー時は元の位置に戻す
        await fetchFormationPositions(currentFormation?.id || '')
      }
    }, 500)
    
    setUpdateTimer(newTimer)
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
  function DraggablePlayerCard({ position, isOnBench = false }: {
    position: FormationPosition
    isOnBench?: boolean
  }) {
    // dnd-kitのuseDraggableフックを使う
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: position.id,
      data: {
        type: 'player',
        position: position,
        isOnBench,
      },
    })
    
    // ベンチ用のスタイル
    if (isOnBench) {
      const style = {
        width: '100%',
        padding: '0.75rem',
        border: '2px solid #d1d5db',
        borderRadius: '0.5rem',
        background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }
      
      return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
          <div className="font-medium text-sm text-center text-gray-900">{position.player.name}</div>
          <div className="text-xs text-gray-600">
            {position.player.number && `#${position.player.number}`}
          </div>
        </div>
      )
    }
    
    // フィールド用のスタイル
    const style = {
      position: 'absolute' as const,
      left: `${position.position_x}px`,
      top: `${position.position_y}px`,
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      width: '3rem',
      height: '3rem',
      background: 'white',
      border: '2px solid #d1d5db',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: isDragging ? 20 : 10,
      opacity: isDragging ? 0.5 : 1,
    }
    
    return (
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <div className="font-bold text-center text-xs truncate w-full px-1 text-gray-900">{position.player.name}</div>
        {position.player.number && (
          <div className="text-gray-600 text-xs">#{position.player.number}</div>
        )}
      </div>
    )
  }
  
  // ドロップエリアコンポーネント
  function DroppableArea({ children }: { children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({
      id: 'pitch',
    })
    
    return (
      <div ref={setNodeRef} className="relative w-full h-64 sm:h-80 md:h-96 bg-green-600 rounded-lg overflow-hidden">
        {children}
      </div>
    )
  }
  
  // ベンチドロップエリアコンポーネント
  function DroppableBench({ children }: { children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
      id: 'bench',
    })
    
    return (
      <div 
        ref={setNodeRef} 
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 rounded-lg transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50 border-2 border-transparent'
        }`}
      >
        {children}
      </div>
    )
  }

  // ドラッグ開始時の処理
  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    setActiveId(active.id as string)
    
    const position = formationPositions.find(p => p.id === active.id)
    if (position) {
      setDraggedPlayer(position)
    }
  }

  // ドラッグ終了時の処理を追加
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    
    setActiveId(null)
    setDraggedPlayer(null)
    
    if (!over) return
    
    const position = formationPositions.find(p => p.id === active.id)
    if (!position) return
    
    const supabase = createClient()
    
    try {
      // ピッチ上でドロップされた場合
      if (over.id === 'pitch') {
        // フィールドが満員でベンチから移動する場合はチェック
        const isFromBench = position.position_x < 0 || position.position_y < 0
        if (isFromBench && getFieldPlayers().length >= 11) {
          setError('フィールドには最大11人までしか配置できません')
          return
        }
        
        let newX = position.position_x
        let newY = position.position_y
        
        // deltaが利用可能な場合はそれを使用
        if (event.delta) {
          newX = position.position_x + event.delta.x
          newY = position.position_y + event.delta.y
        }
        
        // ベンチからフィールドへの移動の場合は中央に配置
        if (isFromBench) {
          newX = 200
          newY = 200
        }
        
        // 位置を更新（handlePositionUpdate内で制限とローカル状態更新を行う）
        handlePositionUpdate(position.id, newX, newY)
      }
      // ベンチ上でドロップされた場合
      else if (over.id === 'bench') {
        // フィールドからベンチに移動
        const { error } = await supabase
          .from('formation_positions')
          .update({
            position_x: -100,
            position_y: -100,
            display_position: 'BENCH'
          })
          .eq('id', position.id)

        if (error) throw error
        
        // フォーメーション位置を再取得
        if (currentFormation) {
          await fetchFormationPositions(currentFormation.id)
        }
      }
    } catch (err) {
      console.error('Error handling drag end:', err)
      setError('選手の移動に失敗しました')
    }
  }

  // 選手割り当て処理を追加
  const handleAssignPlayer = async (playerId: string) => {
    if (!selectedPosition || !currentFormation) return
    
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // 11人制限チェック - フィールドが満員の場合は自動的にベンチに送る
      if (getFieldPlayers().length >= 11) {
        setError('フィールドには最大11人しか配置できません。自動的にベンチに追加します。')
        await handleAddToBench(playerId)
        return
      }

      // 既存の選手がその位置に割り当てられているかチェック
      const existingAtPosition = formationPositions.find(fp => 
        fp.position_x === selectedPosition.x && fp.position_y === selectedPosition.y
      )
      
      if (existingAtPosition) {
        // 既存の選手を自動的にベンチに移動
        await supabase
          .from('formation_positions')
          .update({
            position_x: -100,
            position_y: -100,
            display_position: 'BENCH'
          })
          .eq('id', existingAtPosition.id)
      }

      // 既に選手が別の位置に割り当てられている場合は削除
      const existingPosition = formationPositions.find(fp => fp.player_id === playerId)
      if (existingPosition) {
        await supabase
          .from('formation_positions')
          .delete()
          .eq('id', existingPosition.id)
      }

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
  
  // ベンチに選手を追加
  const handleAddToBench = async (playerId: string) => {
    if (!currentFormation) return
    
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // ベンチに配置（フィールド外の座標）
      const { error } = await supabase
        .from('formation_positions')
        .insert({
          formation_id: currentFormation.id,
          player_id: playerId,
          position_x: -100, // フィールド外の座標
          position_y: -100,
          display_position: 'BENCH'
        })

      if (error) throw error

      setSelectedPosition(null)
      setShowPlayerAssignment(false)
      await fetchFormationPositions(currentFormation.id)
    } catch (err) {
      console.error('Error adding to bench:', err)
      setError('ベンチへの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // フィールドプレイヤー（11人）とベンチプレイヤーを取得
  const getFieldPlayers = () => {
    return formationPositions.filter(fp => fp.position_x >= 0 && fp.position_y >= 0)
  }
  
  const getBenchPlayers = () => {
    return formationPositions.filter(fp => fp.position_x < 0 || fp.position_y < 0)
  }
  
  // 未割り当て選手を取得
  const getUnassignedPlayers = () => {
    const assignedPlayerIds = formationPositions.map(fp => fp.player_id)
    return players.filter(player => !assignedPlayerIds.includes(player.id))
  }
  
  // フィールドに配置可能かチェック
  const canAddToField = () => {
    return getFieldPlayers().length < 11
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

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左側: 選手管理 */}
          <div className="w-full lg:w-1/3">
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
                          <div className="font-medium text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-600">
                            {player.number && `#${player.number}`}
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
                      className={`p-3 border rounded-lg transition-colors ${
                        currentFormation?.id === formation.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleFormationChange(formation.id)}
                        >
                          <div className="font-medium text-gray-900">{formation.name}</div>
                          <div className="text-sm text-gray-600">{formation.formation_pattern}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingFormation(formation)
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側: フォーメーション表示 */}
          <div className="w-full lg:flex-1 space-y-6">
            {/* 全体をDndContextで囲む */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {currentFormation ? `${currentFormation.name} (${currentFormation.formation_pattern})` : 'フォーメーション'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DroppableArea>
                    {/* ピッチのライン */}
                    <div className="absolute inset-0 border-2 border-white opacity-30"></div>
                    <div className="absolute top-1/2 left-0 right-0 border-t border-white opacity-30"></div>
                    <div className="absolute left-1/4 top-0 bottom-0 border-l border-white opacity-30"></div>
                    <div className="absolute right-1/4 top-0 bottom-0 border-l border-white opacity-30"></div>
                    
                    {/* すべてのフィールドプレイヤーを表示 */}
                    {getFieldPlayers()
                      .filter(position => position.id !== activeId)
                      .map((position) => (
                        <DraggablePlayerCard
                          key={position.id}
                          position={position}
                        />
                      ))
                    }
                    
                    {/* 空のカードを表示（フィールドプレイヤーが11人未満で、未使用のパターン位置のみ） */}
                    {currentFormation && FORMATION_PATTERNS[currentFormation.formation_pattern] && getFieldPlayers().length < 11 &&
                      FORMATION_PATTERNS[currentFormation.formation_pattern]
                        .filter(pos => {
                          // その位置に選手がいない場合のみ空カードを表示
                          return !getFieldPlayers().some(fp => fp.position_x === pos.x && fp.position_y === pos.y)
                        })
                        .map((pos, idx) => (
                          <div
                            key={`empty-${idx}`}
                            onClick={() => handleEmptyCardClick(pos)}
                            style={{
                              position: 'absolute',
                              left: `${pos.x}px`,
                              top: `${pos.y}px`,
                              width: '3rem',
                              height: '3rem',
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
                            <div className="font-bold text-gray-600">+</div>
                            <div className="text-gray-600 text-xs">選手追加</div>
                          </div>
                        ))
                    }
                  </DroppableArea>
                </CardContent>
              </Card>
            
              {/* ベンチセクション */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>ベンチ ({getBenchPlayers().length}人)</span>
                    <div className="text-sm text-gray-500">
                      フィールド: {getFieldPlayers().length}/11人
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DroppableBench>
                    {getBenchPlayers().map((position) => (
                      <DraggablePlayerCard
                        key={position.id}
                        position={position}
                        isOnBench={true}
                      />
                    ))}
                    {getBenchPlayers().length === 0 && (
                      <div className="col-span-4 text-center text-gray-500 py-8">
                        ベンチに選手がいません
                        <div className="text-xs mt-2">
                          フィールドから選手をドラッグしてベンチに追加できます
                        </div>
                      </div>
                    )}
                  </DroppableBench>
                </CardContent>
              </Card>
              
              {/* ドラッグオーバーレイ */}
              <DragOverlay>
                {draggedPlayer ? (
                  <div
                    style={{
                      width: '4rem',
                      height: '4rem',
                      background: 'white',
                      border: '2px solid #3b82f6',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      cursor: 'grabbing',
                      zIndex: 1000,
                    }}
                  >
                    <div className="font-bold text-center text-xs truncate w-full px-1">{draggedPlayer.player.name}</div>
                    {draggedPlayer.player.number && (
                      <div className="text-gray-500 text-xs">#{draggedPlayer.player.number}</div>
                    )}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        {/* 選手編集モーダル */}
        {editingPlayer && (
          <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">選手編集</h3>
              <div className="space-y-3">
                <Input
                  placeholder="選手名"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer(prev => prev ? { ...prev, name: e.target.value } : null)}
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
          <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">
                選手を割り当て
              </h3>
              
              {/* 新しい選手を追加ボタン */}
              {!showAddPlayer && (
                <div className="mb-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddPlayer(true)}
                    className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新しい選手を追加
                  </Button>
                </div>
              )}
              
              {/* 選手追加フォーム */}
              {showAddPlayer && (
                <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3">新しい選手を追加</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="選手名"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="背番号（任意）"
                      type="number"
                      value={newPlayer.number}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, number: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddPlayer} disabled={loading}>
                        追加して割り当て
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
                {getUnassignedPlayers().map((player) => (
                  <div
                    key={player.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-500">
                          {player.number && `#${player.number}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAssignPlayer(player.id)}
                          disabled={!canAddToField()}
                        >
                          フィールド
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddToBench(player.id)}
                        >
                          ベンチ
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {getUnassignedPlayers().length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <div className="mb-2">割り当て可能な選手がいません</div>
                    <div className="text-xs">上の「新しい選手を追加」ボタンから選手を追加できます</div>
                  </div>
                )}
              </div>
              
              {!canAddToField() && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  フィールドは11人で満員です。新しい選手はベンチに追加されます。
                </div>
              )}
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

        {/* フォーメーション編集モーダル */}
        {editingFormation && (
          <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">フォーメーション編集</h3>
              <div className="space-y-3">
                <Input
                  placeholder="フォーメーション名"
                  value={editingFormation.name}
                  onChange={(e) => setEditingFormation(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleUpdateFormation} disabled={loading}>
                    更新
                  </Button>
                  <Button variant="outline" onClick={() => setEditingFormation(null)}>
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
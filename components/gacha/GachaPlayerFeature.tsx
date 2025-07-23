'use client'

import { useState } from 'react'
import { GachaButton } from './GachaButton'
import { GachaAnimation } from './GachaAnimation'
import { PlayerReveal } from './PlayerReveal'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'

// 選手データの型定義（dashboard.tsxと同じ）
interface Player {
  id: number
  name: string
  position: string
  country: string
  episode: string
}

interface GachaPlayerFeatureProps {
  userId: string
}

export function GachaPlayerFeature({ userId }: GachaPlayerFeatureProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [revealedPlayer, setRevealedPlayer] = useState<Player | null>(null)
  const [hasDrawn, setHasDrawn] = useState(false)
  const supabase = createClient()

  // 選手データを取得
  const { data: players, isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('id')
      
      if (error) throw error
      return data as Player[]
    }
  })

  // ランダムに選手を選択（ユーザーIDと現在時刻を使用）
  const getRandomPlayer = (): Player | null => {
    if (!players || players.length === 0) return null
    
    // ユーザーIDと現在時刻を組み合わせてシード値を生成
    const now = Date.now()
    const userIdHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const seed = (now + userIdHash) % players.length
    
    return players[seed]
  }

  const handleGacha = () => {
    setIsAnimating(true)
    setHasDrawn(true)
    
    // アニメーション後に選手を表示
    setTimeout(() => {
      const selectedPlayer = getRandomPlayer()
      setRevealedPlayer(selectedPlayer)
      setIsAnimating(false)
    }, 2500) // 2.5秒のアニメーション
  }

  const handlePullAgain = () => {
    setRevealedPlayer(null)
    handleGacha()
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
          <Star className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">選手データを読み込み中...</p>
        <p className="text-sm text-gray-400 mt-1">しばらくお待ちください</p>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">Epic Player Gacha</h2>
      </div>
      
      {!hasDrawn && !isAnimating && (
        <GachaButton onClick={handleGacha} disabled={isAnimating} />
      )}
      
      {isAnimating && (
        <GachaAnimation />
      )}
      
      {revealedPlayer && !isAnimating && (
        <PlayerReveal player={revealedPlayer} onPullAgain={handlePullAgain} />
      )}
    </div>
  )
}
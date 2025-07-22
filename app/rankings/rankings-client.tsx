'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RankingType } from '@/types/ranking'
import { fetchTeamRankings } from '@/lib/ranking/api'
import { RankingTabs } from './components/ranking-tabs'
import { RankingList } from './components/ranking-list'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface RankingsClientProps {
  userId: string
}

export function RankingsClient({ userId }: RankingsClientProps) {
  const [activeTab, setActiveTab] = useState<RankingType>('win_rate')

  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['teamRankings'],
    queryFn: fetchTeamRankings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            ダッシュボードに戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">チームランキング</h1>
            <p className="text-sm text-gray-600 mt-1">
              全チームのパフォーマンスを比較
            </p>
          </div>

          <RankingTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="p-6">
            <RankingList
              teams={teams}
              rankingType={activeTab}
              currentUserId={userId}
              isLoading={isLoading}
              error={error as Error | null}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
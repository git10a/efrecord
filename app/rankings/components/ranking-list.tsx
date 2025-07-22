'use client'

import { RankingListProps } from '@/types/ranking'
import { getTopTeams, getUserRank } from '@/lib/ranking/utils'
import { TeamRankCard } from './team-rank-card'
import { Loader2, TrophyIcon } from 'lucide-react'

export function RankingList({
  teams,
  rankingType,
  currentUserId,
  isLoading = false,
  error = null
}: RankingListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">エラーが発生しました</p>
        <p className="text-sm text-gray-600 mt-2">{error.message}</p>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <TrophyIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">まだランキングデータがありません</p>
        <p className="text-sm text-gray-500 mt-2">試合を行うとランキングが表示されます</p>
      </div>
    )
  }

  const topTeams = getTopTeams(teams, rankingType, 5)
  const currentUserRank = currentUserId ? getUserRank(teams, currentUserId, rankingType) : undefined
  const currentUserTeam = currentUserId ? teams.find(team => team.user_id === currentUserId) : undefined
  const isUserInTop5 = currentUserTeam && topTeams.some(team => team.user_id === currentUserId)

  return (
    <div className="space-y-3">
      {topTeams.map((team, index) => (
        <TeamRankCard
          key={team.user_id}
          rank={index + 1}
          team={team}
          rankingType={rankingType}
          isCurrentUser={currentUserId === team.user_id}
          currentUserRank={currentUserRank}
        />
      ))}

      {currentUserTeam && !isUserInTop5 && currentUserRank && (
        <>
          <div className="text-center py-2">
            <span className="text-gray-400">・・・</span>
          </div>
          <TeamRankCard
            rank={currentUserRank}
            team={currentUserTeam}
            rankingType={rankingType}
            isCurrentUser={true}
            currentUserRank={currentUserRank}
          />
        </>
      )}

      {topTeams.length < 5 && (
        <div className="text-center py-4 text-sm text-gray-500">
          表示可能なチーム: {topTeams.length}チーム
        </div>
      )}
    </div>
  )
}
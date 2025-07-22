'use client'

import { TeamRankCardProps } from '@/types/ranking'
import { rankingConfigs } from '@/lib/ranking/config'
import { Crown } from 'lucide-react'

export function TeamRankCard({
  rank,
  team,
  rankingType,
  isCurrentUser = false,
  currentUserRank
}: TeamRankCardProps) {
  const config = rankingConfigs[rankingType]
  const primaryValue = team[config.primaryMetric] as number

  const getRankDisplay = () => {
    if (rank <= 3) {
      const rankColors = {
        1: 'text-yellow-500',
        2: 'text-gray-400',
        3: 'text-amber-600'
      }
      return (
        <div className="flex items-center gap-1">
          <Crown className={`w-5 h-5 ${rankColors[rank as 1 | 2 | 3]}`} />
          <span className="text-lg font-bold">{rank}</span>
        </div>
      )
    }
    return <span className="text-lg font-bold">{rank}</span>
  }

  return (
    <div
      className={`
        rounded-lg p-4 transition-all duration-200
        ${isCurrentUser 
          ? 'bg-blue-50 border-2 border-blue-300 shadow-md' 
          : 'bg-white border border-gray-200 shadow hover:shadow-md'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center min-w-[50px]">
            {getRankDisplay()}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {team.team_name || 'Unknown Team'}
              {isCurrentUser && (
                <span className="ml-2 text-sm text-blue-600 font-normal">(あなた)</span>
              )}
            </h3>
            
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
              {config.secondaryMetrics.map((metric) => (
                <span key={metric.key}>
                  {metric.label}: {metric.format(team[metric.key] as number)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {config.formatPrimary(primaryValue)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {config.shortLabel}
          </div>
        </div>
      </div>

      {isCurrentUser && rank > 5 && currentUserRank && (
        <div className="mt-3 pt-3 border-t border-blue-200 text-sm text-blue-700">
          実際の順位: {currentUserRank}位
        </div>
      )}
    </div>
  )
}
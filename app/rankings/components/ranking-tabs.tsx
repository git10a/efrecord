'use client'

import { RankingTabsProps, RankingType } from '@/types/ranking'
import { rankingConfigs } from '@/lib/ranking/config'

export function RankingTabs({ activeTab, onTabChange }: RankingTabsProps) {
  const tabs: RankingType[] = ['win_rate', 'total_wins', 'total_points', 'average_points']

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const config = rankingConfigs[tab]
          const isActive = activeTab === tab
          
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`
                whitespace-nowrap py-2 px-3 sm:px-4 border-b-2 font-medium text-sm transition-colors
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="hidden sm:inline">{config.label}</span>
              <span className="sm:hidden">{config.shortLabel}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
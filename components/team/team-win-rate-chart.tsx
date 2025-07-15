'use client'

import { useMemo } from 'react'

interface Match {
  id: string
  result: string
  match_date: string
  created_at: string
}

interface TeamWinRateChartProps {
  matches: Match[]
  className?: string
}

export function TeamWinRateChart({ matches, className = '' }: TeamWinRateChartProps) {
  const chartData = useMemo(() => {
    if (!matches || matches.length === 0) return []

    // 全試合を古い順にソート
    const sortedMatches = matches
      .sort((a, b) => {
        const dateA = new Date(a.match_date).getTime()
        const dateB = new Date(b.match_date).getTime()
        if (dateA !== dateB) return dateA - dateB
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

    // 10試合ごとの勝率を計算
    const chartPoints = []
    for (let i = 10; i <= sortedMatches.length; i += 10) {
      const chunk = sortedMatches.slice(i - 10, i)
      const wins = chunk.filter(m => m.result === 'win').length
      const winRate = (wins / chunk.length) * 100
      
      chartPoints.push({
        gameNumber: i,
        winRate: winRate,
        gamesRange: `${i - 9}-${i}試合目`,
        isLatest: i + 10 > sortedMatches.length
      })
    }

    // 最後の余り（10試合未満）も追加
    if (sortedMatches.length % 10 !== 0) {
      const lastChunkStart = Math.floor(sortedMatches.length / 10) * 10
      const lastChunk = sortedMatches.slice(lastChunkStart)
      const wins = lastChunk.filter(m => m.result === 'win').length
      const winRate = (wins / lastChunk.length) * 100
      
      chartPoints.push({
        gameNumber: sortedMatches.length,
        winRate: winRate,
        gamesRange: `${lastChunkStart + 1}-${sortedMatches.length}試合目`,
        isLatest: true
      })
    }

    return chartPoints
  }, [matches])

  if (chartData.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        データがありません
      </div>
    )
  }

  const maxWinRate = 100
  const chartHeight = 120
  const chartWidth = 300

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-sm font-medium text-gray-700">
        10試合ごとの勝率推移（{chartData.length}区間）
      </div>
      
      <div className="relative bg-gray-50 rounded-lg p-4">
        <svg
          width={chartWidth}
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto"
        >
          {/* 背景グリッド */}
          <defs>
            <pattern id="grid" width="30" height="24" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 24" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y軸のラベル */}
          {[0, 25, 50, 75, 100].map(rate => (
            <g key={rate}>
              <line
                x1="0"
                y1={chartHeight - (rate / maxWinRate) * chartHeight}
                x2={chartWidth}
                y2={chartHeight - (rate / maxWinRate) * chartHeight}
                stroke="#d1d5db"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x="-5"
                y={chartHeight - (rate / maxWinRate) * chartHeight + 4}
                fontSize="10"
                fill="#6b7280"
                textAnchor="end"
              >
                {rate}%
              </text>
            </g>
          ))}

          {/* 折れ線グラフ */}
          {chartData.length > 1 && (
            <polyline
              points={chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * (chartWidth - 20) + 10
                const y = chartHeight - (point.winRate / maxWinRate) * chartHeight
                return `${x},${y}`
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* データポイント */}
          {chartData.map((point, index) => {
            const x = (index / Math.max(chartData.length - 1, 1)) * (chartWidth - 20) + 10
            const y = chartHeight - (point.winRate / maxWinRate) * chartHeight
            
            // 勝率によって色を決定
            let color = '#ef4444' // 赤（低勝率）
            if (point.winRate >= 70) color = '#10b981' // 緑（高勝率）
            else if (point.winRate >= 50) color = '#f59e0b' // オレンジ（中勝率）
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r={point.isLatest ? "4" : "3"}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 10}
                  fontSize="9"
                  fill="#374151"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {Math.round(point.winRate)}%
                </text>
                <text
                  x={x}
                  y={chartHeight + 15}
                  fontSize="8"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {point.gamesRange}
                </text>
              </g>
            )
          })}
        </svg>
        
        {/* 凡例 */}
        <div className="flex justify-center gap-4 mt-6 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">70%以上</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">50-69%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">50%未満</span>
          </div>
        </div>
      </div>
    </div>
  )
}
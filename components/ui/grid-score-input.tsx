'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { Input } from './input'

interface GridScoreInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  maxGrid?: number
  className?: string
}

export function GridScoreInput({ label, value, onChange, maxGrid = 5, className = '' }: GridScoreInputProps) {
  const [isManualMode, setIsManualMode] = useState(value > maxGrid)
  const [isDragging, setIsDragging] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const handleGridClick = (score: number) => {
    onChange(score)
    if (isManualMode && score <= maxGrid) {
      setIsManualMode(false)
    }
  }

  const handleMouseDown = (score: number) => {
    setIsDragging(true)
    handleGridClick(score)
  }

  const handleMouseEnter = (score: number) => {
    if (isDragging) {
      handleGridClick(score)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (score: number) => {
    handleGridClick(score)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    const scoreAttr = element?.getAttribute('data-score')
    if (scoreAttr) {
      const score = parseInt(scoreAttr)
      if (score >= 0 && score <= maxGrid) {
        handleGridClick(score)
      }
    }
  }

  const toggleManualMode = () => {
    setIsManualMode(!isManualMode)
    if (!isManualMode && value > maxGrid) {
      onChange(maxGrid)
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} *
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleManualMode}
          className="text-xs px-2 py-1 h-auto"
        >
          {isManualMode ? 'グリッド' : '手入力'}
        </Button>
      </div>

      {isManualMode ? (
        <Input
          type="number"
          min="0"
          value={value.toString()}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="text-center text-lg font-bold"
        />
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-6 gap-1 select-none"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchEnd={handleMouseUp}
        >
          {[0, 1, 2, 3, 4, 5].map((score) => (
            <div
              key={score}
              data-score={score}
              className={`
                h-12 border-2 rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center font-bold text-lg
                ${score <= value 
                  ? 'bg-blue-500 border-blue-600 text-white shadow-md' 
                  : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:border-gray-300'
                }
                active:scale-95 touch-manipulation
              `}
              onMouseDown={() => handleMouseDown(score)}
              onMouseEnter={() => handleMouseEnter(score)}
              onTouchStart={() => handleTouchStart(score)}
              onTouchMove={handleTouchMove}
            >
              {score}
            </div>
          ))}
        </div>
      )}

      <div className="text-center">
        <span className="text-2xl font-bold text-blue-600">{value}</span>
        <span className="text-sm text-gray-500 ml-1">点</span>
      </div>
    </div>
  )
}
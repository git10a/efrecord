'use client'

import { Sparkles } from 'lucide-react'

interface GachaButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function GachaButton({ onClick, disabled }: GachaButtonProps) {
  return (
    <div className="bg-white rounded-lg p-8 text-center shadow-lg border border-gray-200">
      <div className="space-y-4">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          今日のエピック選手を引こう！
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          ボタンをクリックして、今日のエピック選手を確認しよう
        </p>
        
        <button
          onClick={onClick}
          disabled={disabled}
          className={`relative px-8 py-4 text-lg font-bold text-white rounded-full transform transition-all duration-300 ease-out ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105 hover:shadow-xl active:scale-95'} before:absolute before:inset-0 before:rounded-full before:bg-white before:opacity-0 before:transition-opacity hover:before:opacity-20`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            ガチャを引く
            <Sparkles className="w-5 h-5" />
          </span>
        </button>
      </div>
    </div>
  )
}
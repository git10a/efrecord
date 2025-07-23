'use client'

import { Sparkles } from 'lucide-react'

export function GachaAnimation() {
  return (
    <div className="bg-white rounded-lg p-12 text-center shadow-lg border border-gray-200">
      <div className="relative">
        {/* 回転するメインコンテナ */}
        <div className="w-32 h-32 mx-auto relative">
          {/* 背景のグロー効果 */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl opacity-60 animate-pulse" />
          
          {/* 回転する円 */}
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-pink-600 animate-spin">
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-purple-600 animate-pulse" />
            </div>
          </div>
          
          {/* 周囲のキラキラエフェクト */}
          <div className="absolute -inset-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping animation-delay-200" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping animation-delay-400" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping animation-delay-600" />
          </div>
        </div>
        
        <div className="mt-8 space-y-2">
          <p className="text-lg font-bold text-gray-800 animate-pulse">
            選手を選んでいます...
          </p>
          <p className="text-sm text-gray-600">
            まもなく結果が表示されます！
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  )
}
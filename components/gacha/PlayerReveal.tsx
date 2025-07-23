'use client'

import { Globe, RefreshCw, Sparkles } from 'lucide-react'

interface Player {
  id: number
  name: string
  position: string
  country: string
  episode: string
}

interface PlayerRevealProps {
  player: Player
  onPullAgain: () => void
}

export function PlayerReveal({ player, onPullAgain }: PlayerRevealProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* ヘッダー部分のキラキラ演出 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/20 animate-shimmer" />
        <div className="relative flex items-center justify-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-lg font-bold">Epic Player Revealed!</h3>
          <Sparkles className="w-5 h-5" />
        </div>
      </div>
      
      {/* 選手情報 */}
      <div className="p-6 space-y-4">
        <div className="animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-2xl font-bold text-gray-800">
              {player.name}
            </h3>
            <div className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium rounded-full">
              {player.position}
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{player.country}</span>
            <div className="flex items-center gap-2 ml-2">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(player.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-5 h-5 flex items-center justify-center hover:opacity-80 transition-opacity duration-200"
                title="Googleで検索"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </a>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(player.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-5 h-5 flex items-center justify-center hover:opacity-80 transition-opacity duration-200"
                title="YouTubeで検索"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {player.episode}
            </p>
          </div>
        </div>
        
        {/* もう一度引くボタン */}
        <div className="pt-4">
          <button
            onClick={onPullAgain}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:from-purple-700 hover:to-pink-700 transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            もう一度引く
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}
'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy } from 'lucide-react'

interface PageLayoutProps {
  children: ReactNode
  title: string
  showBack?: boolean
  actions?: ReactNode
}

export function PageLayout({ children, title, showBack = true, actions }: PageLayoutProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ヘッダー */}
      <header className="bg-white/90 backdrop-blur-sm shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {showBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  戻る
                </Button>
              )}
              <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            </div>
            {actions && <div className="flex gap-3">{actions}</div>}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
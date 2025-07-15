'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageLayout } from '@/components/layout/page-layout'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Calendar, FileText } from 'lucide-react'

interface MatchMemo {
  id: string
  match_date: string
  opponent_name: string
  result: string
  memo: string
  created_at: string
}

type RawMatch = {
  id: string
  match_date: string
  memo: string
  result: string
  created_at: string
  opponents: { name: string }[] | null
}

export default function MemosPage() {
  const [memos, setMemos] = useState<MatchMemo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMemos()
  }, [])

  const fetchMemos = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          memo,
          result,
          created_at,
          opponents(name)
        `)
        .eq('user_id', user.id)
        .not('memo', 'is', null)
        .neq('memo', '')
        .order('match_date', { ascending: false })

      if (error) throw error

      const formattedMemos = (data as RawMatch[] | null)?.map((match) => ({
        id: match.id,
        match_date: match.match_date,
        opponent_name: match.opponents?.[0]?.name || '不明',
        result: match.result,
        memo: match.memo,
        created_at: match.created_at
      })) || []

      setMemos(formattedMemos)
    } catch (err) {
      console.error('Error fetching memos:', err)
      setError('メモの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win': return 'text-green-700 bg-green-100 border border-green-200'
      case 'draw': return 'text-gray-700 bg-gray-100 border border-gray-200'
      case 'loss': return 'text-red-700 bg-red-100 border border-red-200'
      default: return 'text-gray-700 bg-gray-100 border border-gray-200'
    }
  }

  const getResultText = (result: string) => {
    switch (result) {
      case 'win': return '勝利'
      case 'draw': return '引分'
      case 'loss': return '敗北'
      default: return '-'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <PageLayout title="試合メモ一覧">
        <div className="text-center py-8">読み込み中...</div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="試合メモ一覧">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {memos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">メモが保存された試合がありません</p>
              <p className="text-sm text-gray-400 mt-2">
                試合記録時にメモを入力すると、ここに表示されます
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {memos.map((memo) => (
              <Card key={memo.id} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatDate(memo.match_date)}
                      </span>
                      <span className="text-sm text-gray-400">vs</span>
                      <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700">
                        {memo.opponent_name}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-medium ${getResultColor(memo.result)}`}>
                      {getResultText(memo.result)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {memo.memo}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
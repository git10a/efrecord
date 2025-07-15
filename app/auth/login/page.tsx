'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError('Googleログインに失敗しました')
      }
    } catch (err) {
      setError('Googleログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            eF record
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            イーフト対戦記録管理アプリ
          </p>
        </CardHeader>
        <div className="p-6 pt-0">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          <Button
            onClick={handleGoogleLogin}
            fullWidth
            disabled={loading}
            className="py-3"
          >
            {loading ? 'ログイン中...' : 'Googleでログイン'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
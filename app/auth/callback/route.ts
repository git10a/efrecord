import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Googleログインの場合、プロフィールを作成
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        // Google アカウントの情報からプロフィールを作成
        const email = data.user.email || ''
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || `user_${data.user.id.slice(0, 8)}`
        const displayName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || username

        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            display_name: displayName,
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture
          })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // エラーの場合はログインページにリダイレクト
  return NextResponse.redirect(`${origin}/auth/login`)
}
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RankingsClient } from './rankings-client'

export default async function RankingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <RankingsClient userId={user.id} />
}
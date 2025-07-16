'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageLayout } from '@/components/layout/page-layout'
import { Edit2, Plus, Users, User, Trash2 } from 'lucide-react'

interface Team {
  id: string
  name: string
  is_shared: boolean
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [myTeamName, setMyTeamName] = useState('マイチーム')
  const [isEditingMyTeam, setIsEditingMyTeam] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    fetchTeams()
    fetchMyTeamName()
  }, [])

  const fetchTeams = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('ログインしてください')
        return
      }

      const { data, error } = await supabase
        .from('opponents')
        .select('*')
        .eq('created_by', user.id)
        .order('name')

      if (error) throw error
      setTeams(data || [])
    } catch (err) {
      console.error('Error fetching teams:', err)
      setError('チーム一覧の取得に失敗しました')
    }
  }

  const fetchMyTeamName = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // まずカラムが存在するかテスト
      const { data, error } = await supabase
        .from('user_stats')
        .select('team_name')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // レコードが存在しない場合はOK
          return
        }
        if (error.message.includes('column "team_name" does not exist')) {
          console.error('team_name column does not exist in user_stats table')
          setError('データベースの設定が完了していません。team_nameカラムを追加してください。')
          return
        }
        throw error
      }
      
      if (data?.team_name) {
        setMyTeamName(data.team_name)
      }
    } catch (err) {
      console.error('Error fetching my team name:', err)
      setError('チーム名の取得に失敗しました。設定を確認してください。')
    }
  }

  const handleEdit = (team: Team) => {
    setEditingId(team.id)
    setEditingName(team.name)
  }

  const handleSave = async (teamId: string) => {
    if (!editingName.trim()) {
      setError('チーム名を入力してください')
      return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      
      // 現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('ログインしてください')
        return
      }

      console.log('Updating team:', teamId, 'to name:', editingName.trim())
      
      const { data, error } = await supabase
        .from('opponents')
        .update({ name: editingName.trim() })
        .eq('id', teamId)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        setError(`更新エラー: ${error.message}`)
        return
      }

      console.log('Update result:', data)

      // 成功時は即座にローカル状態を更新
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === teamId 
            ? { ...team, name: editingName.trim() }
            : team
        )
      )

      setEditingId(null)
      setEditingName('')
      
    } catch (err) {
      console.error('Error updating team:', err)
      setError('チーム名の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) {
      setError('チーム名を入力してください')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error } = await supabase
        .from('opponents')
        .insert({
          name: newTeamName.trim(),
          created_by: user.id,
          is_shared: false
        })

      if (error) throw error

      setNewTeamName('')
      fetchTeams()
    } catch (err) {
      console.error('Error adding team:', err)
      setError('チームの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (teamId: string, teamName: string) => {
    if (!confirm(`「${teamName}」を削除しますか？\n※このチームの試合記録も削除されます`)) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('opponents')
        .delete()
        .eq('id', teamId)

      if (error) throw error
      fetchTeams()
    } catch (err) {
      console.error('Error deleting team:', err)
      setError('チームの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMyTeam = async () => {
    if (!myTeamName.trim()) {
      setError('チーム名を入力してください')
      return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('ログインしてください')
        return
      }

      const { error } = await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          team_name: myTeamName.trim(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // キャッシュを無効化
      await queryClient.invalidateQueries({ queryKey: ['userStats', user.id] })

      setIsEditingMyTeam(false)
    } catch (err) {
      console.error('Error updating my team name:', err)
      setError('チーム名の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout title="チーム管理">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* 自分のチーム名設定 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              自分のチーム名
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {isEditingMyTeam ? (
                <>
                  <Input
                    value={myTeamName}
                    onChange={(e) => setMyTeamName(e.target.value)}
                    placeholder="自分のチーム名を入力"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveMyTeam()
                      if (e.key === 'Escape') setIsEditingMyTeam(false)
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveMyTeam}
                      disabled={loading}
                    >
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingMyTeam(false)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 font-medium text-gray-800">
                    {myTeamName}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingMyTeam(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      編集
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 新しいチーム追加 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              新しいチームを追加
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="チーム名を入力"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
              />
              <Button
                onClick={handleAddTeam}
                disabled={loading || !newTeamName.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                追加
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* チーム一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              チーム一覧
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  {editingId === team.id ? (
                    <div className="flex items-center gap-3 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSave(team.id)
                          if (e.key === 'Escape') handleCancel()
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(team.id)}
                          disabled={loading}
                        >
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{team.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(team)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(team.id, team.name)}
                          disabled={loading}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {teams.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  チームが登録されていません
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
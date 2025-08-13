import { createClient } from '@/lib/supabase/client';
import { Phase, PhaseStats } from '@/types/supabase';

export interface PhaseWithStats extends Phase {
  stats?: PhaseStats;
}

export interface PhaseSummary {
  phase: Phase;
  stats: PhaseStats;
  winRate: number;
  goalDifference: number;
}

/**
 * 現在のアクティブなフェーズを取得
 */
export async function getCurrentPhase(): Promise<Phase | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('is_active', true)
    .single();
    
  if (error) {
    console.error('現在のフェーズ取得エラー:', error);
    return null;
  }
  
  return data;
}

/**
 * すべてのフェーズを取得
 */
export async function getAllPhases(): Promise<Phase[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .order('start_date', { ascending: false });
    
  if (error) {
    console.error('フェーズ一覧取得エラー:', error);
    return [];
  }
  
  return data || [];
}

/**
 * 指定したフェーズの統計を取得
 */
export async function getPhaseStats(phaseId: string, userId: string): Promise<PhaseStats | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('phase_stats')
    .select('*')
    .eq('phase_id', phaseId)
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('フェーズ統計取得エラー:', error);
    return null;
  }
  
  return data;
}

/**
 * ユーザーの全フェーズ統計を取得
 */
export async function getUserPhaseStats(userId: string): Promise<PhaseSummary[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('phase_stats')
    .select(`
      *,
      phases (
        id,
        name,
        start_date,
        end_date,
        is_active,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('phases.start_date', { ascending: false });
    
  if (error) {
    console.error('ユーザーフェーズ統計取得エラー:', error);
    return [];
  }
  
  return (data || []).map(item => ({
    phase: item.phases,
    stats: {
      id: item.id,
      user_id: item.user_id,
      phase_id: item.phase_id,
      matches: item.matches,
      wins: item.wins,
      draws: item.draws,
      losses: item.losses,
      goals_for: item.goals_for,
      goals_against: item.goals_against,
      created_at: item.created_at,
      updated_at: item.updated_at
    },
    winRate: item.matches > 0 ? (item.wins / item.matches) * 100 : 0,
    goalDifference: item.goals_for - item.goals_against
  }));
}

/**
 * 累計統計を取得
 */
export async function getTotalStats(userId: string): Promise<{
  totalMatches: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  overallWinRate: number;
  overallGoalDifference: number;
}> {
  const supabase = createClient();
  
  // 実際の試合記録から累計統計を取得
  const { data, error } = await supabase
    .from('matches')
    .select('result, user_score, opponent_score')
    .eq('user_id', userId);
    
  if (error) {
    console.error('累計統計取得エラー:', error);
    return {
      totalMatches: 0,
      totalWins: 0,
      totalDraws: 0,
      totalLosses: 0,
      totalGoalsFor: 0,
      totalGoalsAgainst: 0,
      overallWinRate: 0,
      overallGoalDifference: 0
    };
  }
  
  const totalMatches = data.length;
  const totalWins = data.filter(match => match.result === 'win').length;
  const totalDraws = data.filter(match => match.result === 'draw').length;
  const totalLosses = data.filter(match => match.result === 'loss').length;
  const totalGoalsFor = data.reduce((sum, match) => sum + match.user_score, 0);
  const totalGoalsAgainst = data.reduce((sum, match) => sum + match.opponent_score, 0);
  
  return {
    totalMatches,
    totalWins,
    totalDraws,
    totalLosses,
    totalGoalsFor,
    totalGoalsAgainst,
    overallWinRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0,
    overallGoalDifference: totalGoalsFor - totalGoalsAgainst
  };
}

/**
 * 次のフェーズを作成（管理者用）
 */
export async function createNextPhase(): Promise<Phase | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('create_next_phase');
    
  if (error) {
    console.error('次のフェーズ作成エラー:', error);
    return null;
  }
  
  // 作成されたフェーズの詳細を取得
  const { data: phaseData, error: phaseError } = await supabase
    .from('phases')
    .select('*')
    .eq('id', data)
    .single();
    
  if (phaseError) {
    console.error('フェーズ詳細取得エラー:', phaseError);
    return null;
  }
  
  return phaseData;
}

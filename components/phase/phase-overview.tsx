'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentPhase, getUserPhaseStats, getTotalStats, PhaseSummary } from '@/lib/phase/api';
import { Phase } from '@/types/supabase';
import { getPhaseProgress, getTimeRemainingText } from '@/lib/phase/utils';

interface PhaseOverviewProps {
  userId: string;
}

export default function PhaseOverview({ userId }: PhaseOverviewProps) {
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [phaseStats, setPhaseStats] = useState<PhaseSummary[]>([]);
  const [totalStats, setTotalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [phase, stats, total] = await Promise.all([
          getCurrentPhase(),
          getUserPhaseStats(userId),
          getTotalStats(userId)
        ]);
        
        setCurrentPhase(phase);
        setPhaseStats(stats);
        setTotalStats(total);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 現在のフェーズ */}
      {currentPhase && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-600">
              🎯 現在のフェーズ: {currentPhase.name}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {new Date(currentPhase.start_date).toLocaleDateString('ja-JP')} 〜 {new Date(currentPhase.end_date).toLocaleDateString('ja-JP')}
            </p>
          </CardHeader>
          <CardContent>
            {/* フェーズ進捗バー */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">フェーズ進捗</span>
                <span className="text-sm font-medium text-blue-600">
                  {getPhaseProgress(currentPhase.start_date, currentPhase.end_date).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getPhaseProgress(currentPhase.start_date, currentPhase.end_date)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {getTimeRemainingText(currentPhase.end_date)}
              </p>
            </div>

            {phaseStats.find(stat => stat.phase.id === currentPhase.id) ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {phaseStats.find(stat => stat.phase.id === currentPhase.id)?.stats.matches || 0}
                  </div>
                  <div className="text-sm text-gray-600">試合数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {phaseStats.find(stat => stat.phase.id === currentPhase.id)?.stats.wins || 0}
                  </div>
                  <div className="text-sm text-gray-600">勝利</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {phaseStats.find(stat => stat.phase.id === currentPhase.id)?.stats.draws || 0}
                  </div>
                  <div className="text-sm text-gray-600">引き分け</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {phaseStats.find(stat => stat.phase.id === currentPhase.id)?.stats.losses || 0}
                  </div>
                  <div className="text-sm text-gray-600">敗北</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">まだ試合記録がありません</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 累計統計 */}
      {totalStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-purple-600">
              📊 累計記録
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {totalStats.totalMatches}
                </div>
                <div className="text-sm text-gray-600">総試合数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {totalStats.totalWins}
                </div>
                <div className="text-sm text-gray-600">総勝利</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totalStats.overallWinRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">勝率</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${totalStats.overallGoalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalStats.overallGoalDifference >= 0 ? '+' : ''}{totalStats.overallGoalDifference}
                </div>
                <div className="text-sm text-gray-600">得失点差</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* フェーズ別記録 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-green-600">
            📈 フェーズ別記録
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phaseStats.map((phaseStat) => (
              <div key={phaseStat.phase.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">
                    {phaseStat.phase.name}
                    {phaseStat.phase.is_active && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        現在
                      </span>
                    )}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {new Date(phaseStat.phase.start_date).toLocaleDateString('ja-JP')} 〜 {new Date(phaseStat.phase.end_date).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold">{phaseStat.stats.matches}</div>
                    <div className="text-xs text-gray-600">試合</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{phaseStat.stats.wins}</div>
                    <div className="text-xs text-gray-600">勝</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-yellow-600">{phaseStat.stats.draws}</div>
                    <div className="text-xs text-gray-600">分</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">{phaseStat.stats.losses}</div>
                    <div className="text-xs text-gray-600">負</div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-sm text-gray-600">
                                        勝率: {phaseStat.winRate.toFixed(1)}% | 
                    得失点差: <span className={phaseStat.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {phaseStat.goalDifference >= 0 ? '+' : ''}{phaseStat.goalDifference}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

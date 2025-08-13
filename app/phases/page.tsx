import PhaseOverview from '@/components/phase/phase-overview';
import { PageLayout } from '@/components/layout/page-layout';

export default function PhasesPage() {
  return (
    <PageLayout title="フェーズ管理">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎯 フェーズ管理
        </h1>
        <p className="text-gray-600 mb-8">
          フェーズ制のシステムで、定期的に記録をリセットし、新しい目標に向かって挑戦できます。
          各フェーズは4週間（木曜始まり木曜終わり）で区切られています。
        </p>
        
        <PhaseOverview />
      </div>
    </PageLayout>
  );
}

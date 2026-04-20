import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { Matches } from '@/components/Matches';
import { Players } from '@/components/Players';
import { PlayerStats } from '@/components/PlayerStats';
import { MapStats } from '@/components/MapStats';
import { Comparison } from '@/components/Comparison';
import { Scouting } from '@/components/Scouting';
import { Reports } from '@/components/Reports';
import { WeeklyTracker } from '@/components/WeeklyTracker';
import { StrategyBoard } from '@/components/StrategyBoard';
import { Rivals } from '@/components/Rivals';
import { Calendar } from '@/components/Calendar';
import { DraftAnalyzer } from '@/components/DraftAnalyzer';
import { VODManager } from '@/components/VODManager';
import { HeatmapViewer } from '@/components/HeatmapViewer';
import { SpectatorMode } from '@/components/SpectatorMode';
import { DiscordBot } from '@/components/DiscordBot';
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics';
import { OCRImporter } from '@/components/OCRImporter';
import { DemoParser } from '@/components/DemoParser';
import { VODReview } from '@/components/VODReview';
import { MobileApp } from '@/components/MobileApp';
import { useAppStore } from '@/store/appStore';

function App() {
  const { activeTab } = useAppStore();

  return (
    <Layout>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'matches' && <Matches />}
      {activeTab === 'players' && <Players />}
      {activeTab === 'player-stats' && <PlayerStats />}
      {activeTab === 'weekly' && <WeeklyTracker />}
      {activeTab === 'maps' && <MapStats />}
      {activeTab === 'strategies' && <StrategyBoard />}
      {activeTab === 'rivals' && <Rivals />}
      {activeTab === 'draft' && <DraftAnalyzer />}
      {activeTab === 'vods' && <VODManager />}
      {activeTab === 'heatmaps' && <HeatmapViewer />}
      {activeTab === 'calendar' && <Calendar />}
      {activeTab === 'spectator' && <SpectatorMode />}
      {activeTab === 'discord' && <DiscordBot />}
      {activeTab === 'advanced' && <AdvancedAnalytics />}
      {activeTab === 'ocr' && <OCRImporter />}
      {activeTab === 'demo-parser' && <DemoParser />}
      {activeTab === 'vod-review' && <VODReview />}
      {activeTab === 'mobile' && <MobileApp />}
      {activeTab === 'comparison' && <Comparison />}
      {activeTab === 'scouting' && <Scouting />}
      {activeTab === 'reports' && <Reports />}
    </Layout>
  );
}

export default App;

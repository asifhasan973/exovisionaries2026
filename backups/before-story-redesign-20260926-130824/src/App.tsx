// Mission Forge - Main Application Root
import React from 'react';
import { ComingSoonModal } from './components/common/ComingSoonModal';
import { Header } from './components/common/Header';
import { SourcesDrawer } from './components/common/SourcesDrawer';
import { AscentView } from './components/views/AscentView';
import { AssemblyView } from './components/views/AssemblyView';
import { CrewSelectionView } from './components/views/CrewSelectionView';
import { DestinationView } from './components/views/DestinationView';
import { LaunchPadView } from './components/views/LaunchPadView';
import { ManifestModal } from './components/views/ManifestModal';
import { MissionSelectView } from './components/views/MissionSelectView';
import { OrbitEndpointView } from './components/views/OrbitEndpointView';
import { ReadinessView } from './components/views/ReadinessView';
import { SitePlanningView } from './components/views/SitePlanningView';
import { WelcomeView } from './components/views/WelcomeView';
import { useMissionStore } from './state/missionStore';

export const App: React.FC = () => {
  const { currentPhase } = useMissionStore();

  const renderActiveView = () => {
    switch (currentPhase) {
      case 'welcome':
        return <WelcomeView />;
      case 'destination':
        return <DestinationView />;
      case 'mission':
        return <MissionSelectView />;
      case 'site':
        return <SitePlanningView />;
      case 'assembly':
        return <AssemblyView />;
      case 'crew':
        return <CrewSelectionView />;
      case 'readiness':
        return <ReadinessView />;
      case 'launchpad':
        return <LaunchPadView />;
      case 'ascent':
        return <AscentView />;
      case 'orbit':
        return <OrbitEndpointView />;
      default:
        return <WelcomeView />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#060a12] text-[#f2f5fa] overflow-hidden select-none">
      {/* Top Header & Progress Stepper */}
      <Header />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        {renderActiveView()}
      </main>

      {/* Global Modals & Drawers */}
      <ComingSoonModal />
      <SourcesDrawer />
      <ManifestModal />
    </div>
  );
};

export default App;

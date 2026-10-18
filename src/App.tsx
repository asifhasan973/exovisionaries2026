import { lazy, Suspense, useEffect } from 'react';
import { OrientationGuard } from './components/common/OrientationGuard';
import { LoadingScreen } from './components/common/LoadingScreen';
import { InstallAppModal } from './components/common/InstallAppModal';
import { useLoadingStore } from './state/loadingStore';

const StoryGame = lazy(() => import('./game/StoryGame').then(module => ({ default: module.StoryGame })));
const ConversationPreview = lazy(() => import('./game/story/ConversationPreview'));
const ExactStory = lazy(() => import('./game/story/ExactStory'));

export default function App() {
  const query = new URLSearchParams(window.location.search);
  const preview = query.get('module') === '3';
  const legacy = query.get('experience') === 'legacy';
  const forceBlock = query.get('forcePortrait') === 'true';

  useEffect(() => {
    // Trigger loading screen upon landing into the project
    useLoadingStore.getState().startLoading('landing');
  }, []);

  return (
    <OrientationGuard forceBlock={forceBlock}>
      <LoadingScreen />
      <InstallAppModal />
      <Suspense>
        {preview ? <ConversationPreview /> : legacy ? <StoryGame /> : <ExactStory />}
      </Suspense>
    </OrientationGuard>
  );
}


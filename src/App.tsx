import { lazy, Suspense, useEffect, useState } from 'react';
import { OrientationGuard } from './components/common/OrientationGuard';
import { LoadingScreen } from './components/common/LoadingScreen';
import { InstallAppModal } from './components/common/InstallAppModal';
import { useLoadingStore } from './state/loadingStore';
import { isDevelopment, parseDebugHash, type DebugRoute } from './debug/debugConfig';
import { DebugToolbar } from './debug/DebugToolbar';

const StoryGame = lazy(() => import('./game/StoryGame').then(module => ({ default: module.StoryGame })));
const ConversationPreview = lazy(() => import('./game/story/ConversationPreview'));
const ExactStory = lazy(() => import('./game/story/ExactStory'));

export default function App() {
  const query = new URLSearchParams(window.location.search);
  const preview = query.get('module') === '3';
  const legacy = query.get('experience') === 'legacy';
  const forceBlock = query.get('forcePortrait') === 'true';

  const [debugRoute, setDebugRoute] = useState<DebugRoute | null>(() =>
    isDevelopment ? parseDebugHash(window.location.hash) : null
  );

  useEffect(() => {
    if (!isDevelopment) return;
    const handleHashChange = () => {
      setDebugRoute(parseDebugHash(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Trigger loading screen upon landing into the project
    useLoadingStore.getState().startLoading('landing');
  }, []);

  // Determine active view to render
  let content;
  if (isDevelopment && debugRoute) {
    if (debugRoute.type === 'page') {
      if (debugRoute.id === 'legacy') {
        content = <StoryGame />;
      } else if (debugRoute.id === 'preview') {
        content = <ConversationPreview />;
      } else if (debugRoute.id === 'archive') {
        content = <ExactStory initialArchive={true} />;
      } else {
        content = <ExactStory initialHome={true} />;
      }
    } else if (debugRoute.type === 'demo') {
      content = <ExactStory debugDemoChapter={debugRoute.id} />;
    } else if (debugRoute.type === 'step') {
      content = <ExactStory debugStepId={debugRoute.id} />;
    } else {
      content = <ExactStory />;
    }
  } else {
    content = preview ? <ConversationPreview /> : legacy ? <StoryGame /> : <ExactStory />;
  }

  return (
    <OrientationGuard forceBlock={forceBlock}>
      <LoadingScreen />
      <InstallAppModal />
      <Suspense>
        {content}
      </Suspense>
      {isDevelopment && <DebugToolbar />}
    </OrientationGuard>
  );
}

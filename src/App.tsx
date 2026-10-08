import { lazy, Suspense } from 'react';

const StoryGame = lazy(() => import('./game/StoryGame').then(module => ({ default: module.StoryGame })));
const ConversationPreview = lazy(() => import('./game/story/ConversationPreview'));
const ExactStory = lazy(() => import('./game/story/ExactStory'));

export default function App() {
  const query = new URLSearchParams(window.location.search);
  const preview = query.get('module') === '3';
  const legacy = query.get('experience') === 'legacy';
  return <Suspense fallback={<p role="status" style={{ padding: 32 }}>Loading mission…</p>}>
    {preview ? <ConversationPreview /> : legacy ? <StoryGame /> : <ExactStory />}
  </Suspense>;
}

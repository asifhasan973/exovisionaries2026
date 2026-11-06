import { useEffect, useRef } from 'react';
import { Check, Globe2, Star } from 'lucide-react';
import { StoryControls, StoryShell } from '@/shared/shell/StoryShell';
import type { SelectionFrame } from '@/game/moon/crew/SelectionScreens';
import { MILESTONES } from '@/game/moon/core/missionMilestones';
import type { MilestoneId } from '@/game/moon/core/missionMilestones';
import { useGameSettings } from '@/shared/shell';
import { sound } from '@exo/audio';
import { isEngineFrozen, useOrientationLifecycleStore } from '@exo/ui';
import '@/shared/shell/missionExperience.css';
import './milestones.css';

export function MilestonePage({
  frame,
  mode,
  current,
  completed,
  destination,
  allComplete,
  onBack,
  onNext,
}: {
  frame: SelectionFrame;
  mode: 'intro' | 'map' | 'complete';
  current: number;
  completed?: MilestoneId;
  destination?: string;
  allComplete?: boolean;
  onBack(): void;
  onNext(): void;
}) {
  const { effects, gentle } = useGameSettings();
  const done = MILESTONES.find(m => m.id === completed);
  const index = done ? MILESTONES.indexOf(done) : current;
  const frozen = useOrientationLifecycleStore(state => state.isFrozen);
  const last = done?.id === 'home' || current >= MILESTONES.length - 1;
  const main = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [mode, completed]);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [current, mode]);

  useEffect(() => {
    if (mode !== 'complete' || !effects) return;
    let played = false;
    const celebrate = () => {
      if (played || isEngineFrozen() || document.hidden) return;
      played = true;
      sound.setMuted(!effects);
      sound.playFanfare();
    };
    celebrate();
    window.addEventListener('game-orientation-resume', celebrate);
    return () => window.removeEventListener('game-orientation-resume', celebrate);
  }, [mode, completed, effects]);

  const isIntro = mode === 'intro';
  const isComplete = mode === 'complete';
  const isMars = destination === 'mars';

  let heroSrc = `/story/milestone-${Math.min(MILESTONES.length, current + 1)}-v1.webp`;
  let heroAria = 'Your Moon adventure';
  let heroTag = 'YOUR MISSION AWAITS';
  let heroText: React.ReactNode = <>From Earth to the Moon<br />and back again.</>;
  let eyebrow = 'YOUR MOON ADVENTURE';
  let titleNode: React.ReactNode = <>{MILESTONES.length} milestones.<br /><em>One Moon mission.</em></>;

  if (isIntro) {
    heroSrc = '/assets/loading/orion_earth_view.jpg';
    heroAria = 'Planetary Exploration Journey';
    heroTag = 'MISSION ROADMAP';
    heroText = 'Planetary Exploration Journey';
    eyebrow = 'PLANETARY EXPLORATION JOURNEY';
    titleNode = <>{MILESTONES.length} milestones.<br /><em>One space expedition.</em></>;
  } else if (isComplete && done) {
    heroSrc = `/story/milestone-${index + 1}-v1.webp`;
    heroAria = `${done.name} complete`;
    heroTag = 'MISSION MILESTONE COMPLETE';
    heroText = `${done.name} complete!`;
    eyebrow = `MILESTONE ${index + 1} / ${MILESTONES.length}`;
    titleNode = <>{done.name}<br /><em>complete!</em></>;
  } else if (allComplete) {
    heroSrc = '/story/milestone-8-v1.webp';
    heroAria = 'Mission Accomplished';
    heroTag = 'MISSION ACCOMPLISHED';
    heroText = <>All 8 milestones completed!<br />Ready for debrief.</>;
    eyebrow = 'MISSION COMPLETED';
    titleNode = <>All milestones.<br /><em>Safe return home.</em></>;
  } else if (isMars) {
    heroSrc = '/assets/loading/mars_perseverance.jpg';
    heroAria = 'Your Mars adventure';
    heroTag = 'DESTINATION: MARS';
    heroText = <>Scouting the Red Planet<br />and scientific discovery.</>;
    eyebrow = 'YOUR MARS ADVENTURE';
    titleNode = <>{MILESTONES.length} milestones.<br /><em>One Mars mission.</em></>;
  }

  const nextLabel = isIntro
    ? 'Start mission'
    : isComplete
      ? (last ? 'See mission results' : 'Next milestone')
      : allComplete
        ? 'See mission results'
        : 'Keep playing';

  return (
    <StoryShell
      {...frame}
      controls={
        <StoryControls
          onBack={onBack}
          onNext={onNext}
          nextLabel={nextLabel}
          hintDisabled
        />
      }
    >
      <main
        ref={main}
        className={`milestone-page ${isComplete ? 'is-complete' : ''} ${gentle ? 'is-gentle' : ''} ${frozen ? 'is-frozen' : ''}`}
        id="story-content"
        tabIndex={-1}
        aria-labelledby="milestone-title"
      >
        <div className="milestone-universe" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <section className="milestone-hero" aria-label={heroAria}>
          <img src={heroSrc} alt="" />
          <div className="milestone-hero-caption">
            <small>{heroTag}</small>
            <strong>{heroText}</strong>
          </div>
        </section>
        <section className="milestone-copy">
          <span className="milestone-eyebrow">{eyebrow}</span>
          <h1 id="milestone-title">{titleNode}</h1>
          {isComplete && done ? (
            <div className="milestone-next-card">
              {last ? (
                <>
                  <Globe2 />
                  <span>Everyone’s home. Let’s see your discoveries.</span>
                </>
              ) : (
                <>
                  <span className="milestone-next-number">{current + 1}</span>
                  <div>
                    <small>UP NEXT</small>
                    <strong>{MILESTONES[current].name}</strong>
                  </div>
                  <span className="milestone-reset">0%</span>
                </>
              )}
            </div>
          ) : null}
          {isComplete && done ? (
            <div className="milestone-earned-stars" aria-hidden="true">
              <Star />
              <Star />
              <Star />
            </div>
          ) : (
            <ol className="milestone-map" aria-label="Eight mission milestones">
              {MILESTONES.map((m, i) => {
                const passed = allComplete ? true : i < current;
                const isCurrent = !allComplete && i === current;
                const isUpcoming = !allComplete && i > current;
                return (
                  <li
                    ref={isCurrent || (allComplete && i === MILESTONES.length - 1) ? activeItemRef : undefined}
                    className={`milestone-item ${passed ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''} ${isUpcoming ? 'is-upcoming' : ''}`}
                    key={m.id}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <img src={`/story/milestone-${i + 1}-v1.webp`} alt="" />
                    <strong>{m.name}</strong>
                    <small>{passed ? <Check size={12} /> : String(i + 1).padStart(2, '0')}</small>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>
    </StoryShell>
  );
}

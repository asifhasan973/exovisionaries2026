import React, { useEffect, useRef } from 'react';
import { GameInfo } from '@exo/ui';
import { Term } from '@/game/moon/core/learning/Learning';
import { GLOSSARY, PART_TERMS } from '@/game/moon/core/learning/glossary';
import type { WorkshopPart } from '@/game/moon/core/preparation';

export function PartDetails({
  part,
  installed,
  onClose,
  onRemove,
}: {
  part: WorkshopPart;
  installed: boolean;
  onClose(): void;
  onRemove(): void;
}) {
  return (
    <GameInfo
      title={part.name}
      onClose={onClose}
      pages={[
        <div key="overview">
          <div className="learning-part-intro">
            <span aria-hidden="true">{PART_TERMS[part.id] ? GLOSSARY[PART_TERMS[part.id]].icon : '🔬'}</span>
            <p>{PART_TERMS[part.id] ? GLOSSARY[PART_TERMS[part.id]].text : part.description}</p>
            {PART_TERMS[part.id] ? (
              <p className="learning-example">{GLOSSARY[PART_TERMS[part.id]].example}</p>
            ) : (
              <p className="learning-example">{part.capability}. Successful use earns science; buying it does not.</p>
            )}
          </div>
        </div>,
        <div key="specs">
          <dl>
            <div>
              <dt>Cost</dt>
              <dd>{part.credits} credits</dd>
            </div>
            <div>
              <dt><Term term="mass">Mass</Term></dt>
              <dd>{part.massKg} kg</dd>
            </div>
            <div>
              <dt><Term term="power">Power</Term></dt>
              <dd>{part.nominalPowerW} W{part.peakPowerW ? ` / ${part.peakPowerW} W peak` : ''}</dd>
            </div>
            {part.outputW ? (
              <div>
                <dt>Sunlight output</dt>
                <dd>{part.outputW} W · 0 W in shadow</dd>
              </div>
            ) : null}
            {part.capacityWh ? (
              <div>
                <dt><Term term="energy">Stored energy</Term></dt>
                <dd>{part.capacityWh} Wh</dd>
              </div>
            ) : null}
          </dl>
          {installed ? (
            <button className="workshop-remove" onClick={onRemove}>
              Remove part
            </button>
          ) : null}
        </div>,
        <div key="notes">
          <p>{part.description}</p>
          <p>These prices and numbers are game values.</p>
          {part.safetyBonus ? <p>Game safety bonus: +{part.safetyBonus}</p> : null}
          {part.assumption ? <p>{part.assumption}</p> : null}
          {part.source ? (
            <a href={part.source} target="_blank" rel="noreferrer">
              NASA: learn about the real system ↗
            </a>
          ) : null}
        </div>,
      ]}
    />
  );
}

export function QuickBuildDialog({ onClose, onConfirm }: { onClose(): void; onConfirm(): void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const target = dialog.current;
    target?.showModal();
    return () => target?.close();
  }, []);

  return (
    <dialog
      className="workshop-dialog"
      ref={dialog}
      onCancel={onClose}
      onClose={event => {
        if (!event.currentTarget.open) onClose();
      }}
      aria-labelledby="quick-build-title"
    >
      <span className="selection-eyebrow">QUICK PREVIEW</span>
      <h2 id="quick-build-title">Auto-build this explorer?</h2>
      <p>Watch all five stages in about 12 seconds. Replaces your parts; you can edit afterward.</p>
      <div className="workshop-dialog-actions">
        <button onClick={onClose} autoFocus>
          Keep building
        </button>
        <button className="conversation-next" onClick={onConfirm}>
          Auto-build
        </button>
      </div>
    </dialog>
  );
}


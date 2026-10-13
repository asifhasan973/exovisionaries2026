import { Component } from 'react';
import type { ReactNode } from 'react';
import { StoryShell, StoryControls } from './StoryShell.tsx';
import type { SelectionFrame } from './SelectionScreens.tsx';

/** A missing chapter chunk must not strand the player without navigation. */
export class MissionBoundary extends Component<{ children: ReactNode; frame: SelectionFrame; onReload(): void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <StoryShell {...this.props.frame} controls={<StoryControls onBack={this.props.frame.onHome!} onNext={this.props.onReload} nextLabel="Reload chapter" hintDisabled/>}>
      <main id="story-content" className="mission-load-failure" role="alert"><h1>Chapter paused</h1><p>Reload the view, or go home.</p><p>Your mission is still in this tab.</p></main>
    </StoryShell>;
  }
}

import { Rocket, RotateCcw } from 'lucide-react';
import { nextFlightGate, releaseIsSafe, RELEASE_WINDOW_SECONDS } from './flight.ts';
import type { FlightState, FlightEvent } from './flight.ts';

export function ReleaseWindow({ flight, act, compact = false }: { flight: FlightState; act(event: FlightEvent): void; compact?: boolean }) {
  const gate = nextFlightGate(flight);
  if (!gate) return null;
  const safe = releaseIsSafe(flight);
  const start = gate.t - 8;
  const cursor = Math.max(0, Math.min(100, (flight.t - start) / (8 + RELEASE_WINDOW_SECONDS) * 100));
  return <div className={`flight-window ${safe ? 'is-safe' : ''} ${compact ? 'is-compact' : ''}`} role="group" aria-label={compact ? 'Canvas release controls' : 'Release window'}>
    <span>{flight.missedWindow ? 'WINDOW MISSED' : safe ? 'GREEN · RELEASE NOW' : gate.event === 'booster' ? 'WAIT FOR BOOSTER BURNOUT' : 'WAIT UNTIL CLEAR OF THICK AIR'}</span>
    <div className="flight-window-track" aria-hidden="true"><i className="safe-band" /><i className="window-cursor" style={{ left: `${cursor}%` }} /></div>
    {flight.missedWindow ? <button className="conversation-next flight-action" onClick={() => act({ type: 'flight-retry-window' })}><RotateCcw size={19} />Retry this stage</button>
      : <button className="conversation-next flight-action" disabled={flight.status !== 'running' || flight.t < 4} onClick={() => act({ type: 'flight-action', action: gate.event })}><Rocket size={19} />{gate.label}</button>}
    {!compact ? <p className="flight-window-feedback" role="status">{flight.feedback ?? 'Release inside the green band. Early taps are safely blocked.'}</p> : null}
  </div>;
}

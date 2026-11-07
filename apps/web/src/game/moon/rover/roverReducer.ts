import type { MoonSession } from '@/game/moon/shared/session';
import { COURSE_HOLES, COURSE_ROCKS } from './roverCourse.ts';
import {
  ROVER_CAMPS,
  ROVER_CHARGER,
  ROVER_MODEL,
  type RoverCommand,
  type RoverEvent,
  type RoverSiteId,
  type RoverState,
  advance,
  nearbyRoverSite,
  roverActive,
  roverAim,
  roverAtBase,
  roverGoal,
  roverReady,
  saveCamp,
  stopped,
  freshRover,
} from './rover.ts';

export function apply(s: RoverState, command: RoverCommand, moon: MoonSession): RoverState {
  switch (command.type) {
    case 'tour': {
      if (s.version >= 3 || ['ready', 'complete'].includes(s.phase)) return s;
      const base = s.version === 1 ? apply(s, { type: 'upgrade' }, moon) : s;
      const count = Math.min(2, s.deposited.length + s.cargo.length), deposits = Math.min(2, s.deposited.length);
      const deposited = (['A', 'C'] as RoverSiteId[]).slice(0, deposits), cargo = (['A', 'C'] as RoverSiteId[]).slice(deposits, count);
      const chargeDone = count >= 2, hardSeen = chargeDone || s.hardSeen, debriefed = hardSeen;
      const next: RoverState = { ...base, version: 3, originVersion: s.originVersion ?? s.version, phase: s.deployed ? 'exploring' : 'intro', talk: 'intro', line: 0, cargo, deposited, drilled: [...deposited, ...cargo, ...(hardSeen ? ['B' as const] : [])], chargeDone, hardSeen, debriefed, chargeSeconds: 0, stowed: false, deliveryIds: [], phaseTime: 0, drillSite: null, drillProgress: 0, assisted: true, ...stopped };
      next.checkpoint = saveCamp(next, Math.max(0, ROVER_CAMPS.findIndex(camp => Math.hypot(camp.x - next.x, camp.z - next.z) < 3.5)));
      return next;
    }
    case 'charge': {
      if (s.version < 3 || s.paused) return s;
      if (!command.held) return s.chargeHeld ? { ...s, chargeHeld: false } : s;
      return s.deposited.length >= 1 && s.phase === 'exploring' && Math.abs(s.speed) < .25 && Math.hypot(s.x - ROVER_CHARGER.x, s.z - ROVER_CHARGER.z) < 3.5 ? { ...s, phase: 'charging', phaseTime: 0, ...stopped, chargeHeld: true } : s;
    }
    case 'upgrade': {
      if (s.version >= 2) return s;
      let x = s.x, z = s.z; const safe = (x: number, z: number) => Math.abs(x) < 45 && Math.abs(z) < 45 && !COURSE_ROCKS.some(rock => Math.hypot(x - rock.x, z - rock.z) < rock.radius + 1.2) && !COURSE_HOLES.some(hole => Math.hypot(hole.x - x, hole.z - z) < hole.radius + 1.2);
      if (!safe(x, z)) { outer: for (let radius = 1; radius <= 12; radius++) for (let i = 0; i < 24; i++) { const nx = s.x + Math.sin(i * Math.PI / 12) * radius, nz = s.z + Math.cos(i * Math.PI / 12) * radius; if (safe(nx, nz)) { x = nx; z = nz; break outer; } } }
      return { ...s, version: 2, originVersion: s.originVersion ?? 1, x, z, steerAngle: 0, sampleStage: 'aim', sampleResult: null, phaseTime: 0, drillProgress: 0, assisted: s.assisted || x !== s.x || z !== s.z, ...stopped };
    }
    case 'restart': return s.phase === 'intro' ? { ...s, assisted: true } : s;
    case 'stop': return { ...s, ...stopped };
    case 'talk': {
      if (!['intro', 'cabin'].includes(s.phase)) return s;
      if (s.line === 0) return { ...s, line: 1 };
      const phase = s.talk === 'intro' ? 'deploying' : s.talk === 'launch' ? 'boarding' : 'exploring';
      const next: RoverState = { ...s, phase, line: 0, phaseTime: 0, debriefed: s.debriefed || s.talk === 'setback', ...stopped };
      if (s.version >= 3 && s.talk === 'setback') next.checkpoint = saveCamp(next, 2);
      return next;
    }
    case 'control': return ['exploring', 'drilling'].includes(s.phase) && !s.paused ? { ...s, throttle: s.phase === 'drilling' ? 0 : command.throttle, steer: s.phase === 'drilling' ? 0 : command.steer, drillHeld: s.phase === 'drilling' && command.drill } : s;
    case 'advance': return advance(s, command.frames, moon);
    case 'aim': {
      if (s.version < 2 || s.phase !== 'drilling') return s;
      const hit = roverAim(s) >= .32 && roverAim(s) <= .68;
      return hit ? { ...s, phase: 'collecting', sampleStage: 'extract', drillProgress: 0, phaseTime: 0, notice: null, ...stopped } : { ...s, aimMisses: s.aimMisses + 1, phaseTime: 0, notice: 'heat' };
    }
    case 'continue': return s.version >= 2 && ['sample-result', 'delivery-result'].includes(s.phase) ? { ...s, phase: s.version >= 3 && s.sampleResult === 'hard' ? 'cabin' : 'exploring', ...(s.version >= 3 && s.sampleResult === 'hard' ? { talk: 'setback', line: 0 } as const : {}), sampleResult: null, phaseTime: 0, notice: null, ...stopped } : s;
    case 'drill': { const site = nearbyRoverSite(s), goal = roverGoal(s); return s.phase === 'exploring' && !s.paused && Math.abs(s.speed) < .25 && site && !s.drilled.includes(site.id) && (s.version < 3 || goal.kind === 'sample' && goal.id === site.id) ? { ...s, phase: 'drilling', drillSite: site.id, drillProgress: 0, heat: 0, phaseTime: 0, sampleStage: 'aim', sampleResult: null, aimMisses: 0, notice: null, ...stopped } : s; }
    case 'cancel': return s.phase === 'drilling' ? { ...s, phase: 'exploring', drillProgress: 0, ...stopped } : s;
    case 'unload': {
      if (s.phase !== 'exploring' || !roverAtBase(s) || Math.abs(s.speed) > .25) return s;
      if (s.version >= 3) return s.cargo.length ? { ...s, phase: 'delivering', phaseTime: 0, deliveryIds: [...s.cargo], ...stopped } : s;
      let next: RoverState = { ...s, deposited: [...new Set([...s.deposited, ...s.cargo])], cargo: [], notice: 'deposit', ...stopped };
      next.checkpoint = saveCamp(next, 0);
      if (next.hardSeen && !next.debriefed) next = { ...next, phase: 'cabin', talk: 'setback', line: 0 };
      return next;
    }
    case 'prepare': return s.phase === 'exploring' && roverAtBase(s) && s.deposited.length >= ROVER_MODEL.required && Math.abs(s.speed) < .25 && (s.version < 3 || s.chargeDone && s.hardSeen && s.debriefed) ? { ...s, phase: s.version >= 3 && !s.stowed ? 'stowing' : 'cabin', phaseTime: 0, talk: 'launch', line: 0, ...stopped } : s;
    case 'retry': {
      if (s.phase !== 'failed') return s;
      const checkpoint = s.checkpoint, camp = ROVER_CAMPS[checkpoint.camp];
      return { ...s, phase: 'exploring', x: camp.x, z: camp.z, heading: 0, batteryWh: s.capacityWh, ...stopped, cargo: [...checkpoint.cargo], deposited: [...checkpoint.deposited], drilled: [...checkpoint.drilled], hardSeen: checkpoint.hardSeen, debriefed: checkpoint.debriefed, ...(s.version >= 3 ? { chargeDone: checkpoint.chargeDone ?? false, chargeSeconds: 0, deliveryIds: [], stowed: false } : {}), elapsed: checkpoint.elapsed, attempts: s.attempts + 1, assisted: true, paused: false, remainder: 0, drillSite: null, drillProgress: 0, heat: 0, steerAngle: 0, sampleStage: 'aim', sampleResult: null, phaseTime: 0, failedReason: null, campTime: 0, notice: 'checkpoint' };
    }
    case 'launch': return roverReady(s) ? { ...s, phase: 'complete', ...stopped } : s;
  }
}

export function reduceRover(s: RoverState, event: RoverEvent, moon: MoonSession): RoverState {
  if (event.type === 'rover-pause' || event.type === 'rover-resume' || event.type === 'rover-input-pause') {
    const commands = s.throttle || s.steer || s.drillHeld || s.speed || s.chargeHeld || event.type === 'rover-resume' && s.commands.at(-1)?.type !== 'stop' ? [...s.commands, { type: 'stop' as const }] : s.commands;
    return { ...s, paused: event.type === 'rover-input-pause' ? s.paused : event.type === 'rover-pause' && roverActive(s), ...stopped, commands };
  }
  if (s.paused && !['rover-retry', 'rover-upgrade', 'rover-tour'].includes(event.type)) return s;
  let command: RoverCommand, remainder = s.remainder;
  if (event.type === 'rover-tick') {
    if (!Number.isFinite(event.seconds) || event.seconds <= 0 || !roverActive(s)) return s;
    const seconds = remainder + Math.min(.25, event.seconds), frames = Math.floor((seconds + 1e-9) / (s.version >= 2 ? .05 : ROVER_MODEL.step));
    remainder = Math.max(0, seconds - frames * (s.version >= 2 ? .05 : ROVER_MODEL.step)); if (!frames) return { ...s, remainder };
    command = { type: 'advance', frames };
  } else command = { ...event, type: event.type.replace('rover-', '') } as RoverCommand;
  if (!validCommand(command) || s.commands.length >= 16000) return s;
  if (command.type === 'control' && command.throttle === s.throttle && command.steer === s.steer && command.drill === s.drillHeld) return s;
  const next = apply(s, command, moon); if (next === s) return s;
  const commands = [...s.commands], last = commands.at(-1);
  if (command.type === 'advance' && last?.type === 'advance' && last.frames + command.frames <= 100000) commands[commands.length - 1] = { type: 'advance', frames: last.frames + command.frames }; else commands.push(command);
  return { ...next, remainder, commands };
}

function validCommand(command: RoverCommand) {
  return command && typeof command === 'object' && ['tour', 'charge', 'upgrade', 'aim', 'continue', 'restart', 'stop', 'talk', 'control', 'advance', 'drill', 'cancel', 'unload', 'prepare', 'retry', 'launch'].includes(command.type)
    && (command.type !== 'charge' || typeof command.held === 'boolean')
    && (command.type !== 'control' || [-1, 0, 1].includes(command.throttle) && [-1, 0, 1].includes(command.steer) && typeof command.drill === 'boolean')
    && (command.type !== 'advance' || Number.isInteger(command.frames) && command.frames > 0 && command.frames <= 100000);
}

/** Positions, battery, containers, checkpoints and success are reconstructed from bounded receipts. */
export function restoreRover(raw: unknown, moon: MoonSession): RoverState | undefined {
  if (!raw || typeof raw !== 'object') return undefined; const saved = raw as RoverState;
  if (![1, 2, 3, 4].includes(saved.version) || saved.signature !== moon.designSignature || !Array.isArray(saved.commands) || saved.commands.length > 16000) return undefined;
  if (saved.originVersion !== undefined && ![1, 2, 3, 4].includes(saved.originVersion)) return undefined;
  let s = freshRover(moon, saved.originVersion ?? saved.version), frames = 0;
  for (const command of saved.commands) { if (!validCommand(command) || command.type === 'advance' && (frames += command.frames) > 200000) return undefined; s = apply(s, command, moon); }
  if (s.version !== saved.version) return undefined;
  return { ...s, commands: [...saved.commands], paused: roverActive(s), ...stopped, remainder: 0 };
}

/** A single contextual action is shared by the E key and its on-screen prompt. */
export function roverInteraction(s: RoverState): { label: string; event: RoverEvent } | null {
  if (s.paused) return { label: 'Resume driving', event: { type: 'rover-resume' } };
  if (s.phase === 'delivery-result') return { label: 'Delivery complete · Continue', event: { type: 'rover-continue' } };
  if (s.phase === 'sample-result') return { label: s.sampleResult === 'hard' ? 'Try another site' : 'Back to driving', event: { type: 'rover-continue' } };
  if (s.phase === 'drilling' && s.version >= 2) return { label: 'Stop the marker in the green zone', event: { type: 'rover-aim' } };
  if (s.phase === 'ready') return { label: 'Launch ascent cabin', event: { type: 'rover-launch' } };
  if (s.phase === 'failed') return { label: 'Retry sunny checkpoint', event: { type: 'rover-retry' } };
  if (s.phase !== 'exploring' || Math.abs(s.speed) > .3) return null;
  if (roverAtBase(s) && s.cargo.length) return { label: `Unload ${s.cargo.length} sample${s.cargo.length > 1 ? 's' : ''}`, event: { type: 'rover-unload' } };
  if (s.version >= 3 && s.deposited.length >= 1 && Math.hypot(s.x - ROVER_CHARGER.x, s.z - ROVER_CHARGER.z) < 3.5 && (!s.chargeDone || s.batteryWh < s.capacityWh * .95)) return { label: 'Hold E to charge', event: { type: 'rover-charge', held: true } };
  if (roverAtBase(s) && s.deposited.length >= 2) return { label: s.version >= 3 ? 'Park rover inside' : 'Seal samples and prepare launch', event: { type: 'rover-prepare' } };
  const site = nearbyRoverSite(s); return site && !s.drilled.includes(site.id) && (s.version < 3 || roverGoal(s).kind === 'sample' && roverGoal(s).id === site.id) ? { label: `Collect at ${site.id} · ${site.name}`, event: { type: 'rover-drill' } } : null;
}

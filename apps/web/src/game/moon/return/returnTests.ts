import type { ReturnConnection } from "@/game/moon/shared/validation";

export interface ReturnTestState {
  version: 1;
  id: ReturnConnection;
  phase: "ready" | "running" | "passed" | "failed";
  elapsed: number;
  throttle: number;
  angle: number;
  held: boolean;
  paused: boolean;
  deployedAt: number | null;
}
export type ReturnTestAction =
  | { type: "return-test-select"; id: ReturnConnection }
  | { type: "return-test-throttle"; value: number }
  | { type: "return-test-turn"; direction: -1 | 1 }
  | { type: "return-test-hold"; held: boolean }
  | { type: "return-test-start" }
  | { type: "return-test-deploy" }
  | { type: "return-test-pause" }
  | { type: "return-test-reset" }
  | { type: "return-test-tick"; seconds: number };

export const RETURN_TEST_NAMES: Record<ReturnConnection, string> = {
  ascent: "Ascent engine",
  service: "Service engine",
  shield: "Heat shield",
  parachutes: "Parachutes",
};
export const RETURN_TEST_DURATION: Record<ReturnConnection, number> = {
  ascent: 2.2,
  service: 2.4,
  shield: 2.6,
  parachutes: 2.8,
};
export const emptyReturnTest = (
  id: ReturnConnection = "ascent",
): ReturnTestState => ({
  version: 1,
  id,
  phase: "ready",
  elapsed: 0,
  throttle: 30,
  angle: id === "shield" ? 120 : -36,
  held: false,
  paused: false,
  deployedAt: null,
});
export const thrustInBand = (value: number) => value >= 55 && value <= 75;
export const chuteWindow = (test: ReturnTestState) =>
  test.phase === "running" &&
  test.deployedAt === null &&
  test.elapsed >= 1.4 &&
  test.elapsed <= 4.2;
export const testRunning = (test: ReturnTestState) =>
  test.phase === "running" &&
  !test.paused &&
  (test.id !== "ascent" || test.held);
export function testProgress(test: ReturnTestState) {
  if (test.phase === "passed") return 1;
  const seconds =
    test.id === "parachutes"
      ? test.deployedAt === null
        ? 0
        : test.elapsed - test.deployedAt
      : test.elapsed;
  return Math.min(
    1,
    seconds / (RETURN_TEST_DURATION as Record<string, number>)[test.id],
  );
}

/** Short rehearsal challenges; they never consume the mission's protected return fuel. */
export function reduceReturnTest(
  test: ReturnTestState,
  action: ReturnTestAction,
): ReturnTestState {
  if (action.type === "return-test-select") return emptyReturnTest(action.id);
  if (action.type === "return-test-reset") return emptyReturnTest(test.id);
  if (action.type === "return-test-pause")
    return { ...test, held: false, paused: test.phase === "running" };
  if (action.type === "return-test-throttle") {
    if (
      test.id !== "ascent" ||
      !Number.isFinite(action.value) ||
      test.phase === "passed"
    )
      return test;
    return { ...test, throttle: Math.max(0, Math.min(100, action.value)) };
  }
  if (action.type === "return-test-turn") {
    if (
      !["service", "shield"].includes(test.id) ||
      test.phase === "running" ||
      test.phase === "passed" ||
      ![-1, 1].includes(action.direction)
    )
      return test;
    const angle =
      test.angle + action.direction * (test.id === "shield" ? 30 : 6);
    return {
      ...test,
      phase: "ready",
      elapsed: 0,
      angle:
        test.id === "shield"
          ? ((((angle + 180) % 360) + 360) % 360) - 180
          : Math.max(-48, Math.min(48, angle)),
    };
  }
  if (action.type === "return-test-hold") {
    if (test.id !== "ascent" || test.phase === "passed") return test;
    return {
      ...test,
      held: action.held,
      paused: false,
      phase: action.held ? "running" : test.phase,
    };
  }
  if (action.type === "return-test-start") {
    if (test.phase === "running") return { ...test, paused: false };
    if (test.phase === "passed" || test.id === "ascent") return test;
    return {
      ...test,
      phase: "running",
      elapsed: 0,
      paused: false,
      deployedAt: null,
    };
  }
  if (action.type === "return-test-deploy")
    return chuteWindow(test) ? { ...test, deployedAt: test.elapsed } : test;
  if (
    action.type !== "return-test-tick" ||
    !testRunning(test) ||
    !Number.isFinite(action.seconds) ||
    action.seconds <= 0
  )
    return test;
  const dt = Math.min(0.1, action.seconds);
  const elapsed =
    test.id === "ascent" && !thrustInBand(test.throttle)
      ? Math.max(0, test.elapsed - dt * 0.5)
      : test.elapsed + dt;
  const next = { ...test, elapsed };
  if (test.id === "ascent" && elapsed >= RETURN_TEST_DURATION.ascent)
    return { ...next, phase: "passed", held: false };
  if (test.id === "service" && elapsed >= RETURN_TEST_DURATION.service)
    return { ...next, phase: Math.abs(test.angle) <= 6 ? "passed" : "failed" };
  if (test.id === "shield" && elapsed >= RETURN_TEST_DURATION.shield)
    return { ...next, phase: Math.abs(test.angle) <= 15 ? "passed" : "failed" };
  if (test.id === "parachutes") {
    if (test.deployedAt === null && elapsed > 4.2)
      return { ...next, phase: "failed" };
    if (
      test.deployedAt !== null &&
      elapsed - test.deployedAt >= RETURN_TEST_DURATION.parachutes
    )
      return { ...next, phase: "passed" };
  }
  return next;
}

export function restoreReturnTest(raw: unknown): ReturnTestState {
  if (!raw || typeof raw !== "object") return emptyReturnTest();
  const value = raw as ReturnTestState;
  if (!["ascent", "service", "shield", "parachutes"].includes(value.id))
    return emptyReturnTest();
  const clean = emptyReturnTest(value.id);
  if (
    !Number.isFinite(value.elapsed) ||
    !Number.isFinite(value.angle) ||
    !Number.isFinite(value.throttle)
  )
    return clean;
  return {
    ...clean,
    phase: ["ready", "running", "passed", "failed"].includes(value.phase)
      ? value.phase
      : "ready",
    elapsed: Math.max(0, Math.min(8, value.elapsed)),
    angle: Math.max(-180, Math.min(180, value.angle)),
    throttle: Math.max(0, Math.min(100, value.throttle)),
    paused: value.phase === "running",
    deployedAt:
      value.id === "parachutes" &&
      Number.isFinite(value.deployedAt) &&
      value.deployedAt !== null
        ? Math.max(1.4, Math.min(4.2, value.deployedAt))
        : null,
  };
}

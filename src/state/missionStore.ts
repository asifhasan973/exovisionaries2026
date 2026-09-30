// Mission Forge - Unified Mission State Machine and Persistence Store
import { create } from 'zustand';
import { CANDIDATES } from '../data/crew';
import { validateLaunchReadiness } from '../engine/validation';
import { sound } from '../audio/soundEngine';
import { QUICK_LAUNCH_CREW, QUICK_LAUNCH_INSTALLED_PARTS } from '../data/defaultManifest';
import { PARTS, SLOTS } from '../data/parts';
import { computeBudgetAccounting, computeMassAccounting } from '../engine/accounting';
import { STORY_BUILD_INSTALLED_PARTS } from '../game/assemblyMission';
import {
  AssemblyViewMode,
  CrewRole,
  DestinationId,
  LaunchSnapshot,
  MissionId,
  MissionPhase,
  SiteId,
  SlotInterface
} from '../types/mission';

const STORAGE_KEY = 'mission_forge_story_v2';

interface ComingSoonState {
  isOpen: boolean;
  title: string;
  description: string;
}

interface AudioSettings {
  isMuted: boolean;
  captionsEnabled: boolean;
  reducedMotion: boolean;
}

interface MissionState {
  // Navigation
  currentPhase: MissionPhase;
  selectedDestination: DestinationId;
  selectedMission: MissionId;
  selectedSite: SiteId;

  // Assembly State
  installedParts: Partial<Record<SlotInterface, string>>;
  assemblyViewMode: AssemblyViewMode;
  isExplodedView: boolean;
  selectedSlotId: SlotInterface | null;
  selectedPartId: string | null;
  isDraggingPartId: string | null;

  // Undo / Redo
  undoStack: Partial<Record<SlotInterface, string>>[];
  redoStack: Partial<Record<SlotInterface, string>>[];

  // Crew State
  crewAssignments: Partial<Record<CrewRole, string | null>>;
  missionDurationDays: number;
  systemTestsPassed: boolean;

  // Flight & Orbit Snapshot
  launchSnapshot: LaunchSnapshot | null;
  ascentProgress: number; // 0 to 1
  isAscentPaused: boolean;

  // Modals & Drawers
  comingSoon: ComingSoonState;
  isSourcesDrawerOpen: boolean;
  isManifestModalOpen: boolean;
  audioSettings: AudioSettings;

  // Actions
  setPhase: (phase: MissionPhase) => void;
  selectDestination: (id: DestinationId) => void;
  selectMission: (id: MissionId) => void;
  selectSite: (id: SiteId) => void;

  // Assembly Actions
  setAssemblyViewMode: (mode: AssemblyViewMode) => void;
  toggleExplodedView: () => void;
  selectSlot: (slotId: SlotInterface | null) => void;
  selectPart: (partId: string | null) => void;
  setDraggingPartId: (partId: string | null) => void;
  installPart: (slotId: SlotInterface, partId: string) => void;
  installBatch: (partIds: string[]) => { installed: string[]; skipped: string[] };
  replacePart: (slotId: SlotInterface, partId: string) => void;
  uninstallPart: (slotId: SlotInterface) => void;
  undo: () => void;
  redo: () => void;

  // Crew Actions
  assignCrew: (role: CrewRole, candidateId: string) => void;
  unassignCrew: (role: CrewRole) => void;
  setMissionDurationDays: (days: number) => void;

  // Flight Actions
  applyQuickLaunchManifest: () => void;
  applyStoryBuild: () => void;
  completeSystemTests: () => void;
  prepareLaunch: () => boolean; // creates immutable snapshot
  setAscentProgress: (progress: number) => void;
  toggleAscentPause: () => void;
  resetAscent: () => void;
  returnToHangar: () => void;
  resetMission: () => void;

  // UI / Modals
  openComingSoon: (title: string, description: string) => void;
  closeComingSoon: () => void;
  toggleSourcesDrawer: (open?: boolean) => void;
  toggleManifestModal: (open?: boolean) => void;
  toggleMute: () => void;
  toggleCaptions: () => void;
  toggleReducedMotion: () => void;
}

// Every new adventure begins with an empty workbench. The legacy save stays untouched.
const INITIAL_INSTALLED_PARTS: Partial<Record<SlotInterface, string>> = {};

const INITIAL_CREW: Partial<Record<CrewRole, string | null>> = {
  commander: null,
  scientist: null,
  engineer: null
};

// Safe load from LocalStorage
function loadSavedState(): Partial<MissionState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const installed: Partial<Record<SlotInterface, string>> = {};
    for (const slot of SLOTS) {
      const id = parsed.installedParts?.[slot.id];
      if (PARTS[id]?.compatibleSlots.includes(slot.id) && !Object.values(installed).includes(id)) installed[slot.id] = id;
    }
    const crew: Partial<Record<CrewRole, string | null>> = {};
    for (const role of ['commander', 'scientist', 'engineer'] as CrewRole[]) {
      const id = parsed.crewAssignments?.[role];
      const candidate = CANDIDATES.find(c => c.id === id);
      if (candidate && (candidate.primaryRole === role || candidate.secondaryRole === role) && !Object.values(crew).includes(id)) crew[role] = id;
    }
    // Resume flights at the pad rather than restoring a half-finished animation.
    const phases: MissionPhase[] = ['welcome','destination','mission','site','assembly','testing','crew','readiness','launchpad','orbit'];
    const phase = parsed.currentPhase === 'ascent' ? 'launchpad' : parsed.currentPhase;
    return { currentPhase: phases.includes(phase) ? phase : 'welcome', installedParts: installed,
      crewAssignments: crew, selectedDestination: 'moon', selectedMission: 'lunar-ice-explorer',
      selectedSite: parsed.selectedSite === 'crater-rim' ? 'crater-rim' : 'ridge',
      missionDurationDays: Math.max(8, Math.min(21, Number(parsed.missionDurationDays) || 8)),
      systemTestsPassed: parsed.systemTestsPassed === true,
      audioSettings: { isMuted: parsed.audioSettings?.isMuted !== false, captionsEnabled: true,
        reducedMotion: parsed.audioSettings?.reducedMotion === true } };
  } catch {
    return null;
  }
}

// Safe persist to LocalStorage
function saveState(state: Partial<MissionState>) {
  try {
    const toSave = {
      currentPhase: state.currentPhase,
      selectedDestination: state.selectedDestination,
      selectedMission: state.selectedMission,
      selectedSite: state.selectedSite,
      installedParts: state.installedParts,
      crewAssignments: state.crewAssignments,
      missionDurationDays: state.missionDurationDays,
      systemTestsPassed: state.systemTestsPassed,
      launchSnapshot: state.launchSnapshot,
      audioSettings: state.audioSettings
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}

const saved = loadSavedState();

export const useMissionStore = create<MissionState>((set, get) => ({
  currentPhase: saved?.currentPhase || 'welcome',
  selectedDestination: saved?.selectedDestination || 'moon',
  selectedMission: saved?.selectedMission || 'lunar-ice-explorer',
  selectedSite: saved?.selectedSite || 'ridge',

  installedParts: saved?.installedParts || INITIAL_INSTALLED_PARTS,
  assemblyViewMode: 'fullStack',
  isExplodedView: false,
  selectedSlotId: null,
  selectedPartId: null,
  isDraggingPartId: null,

  undoStack: [],
  redoStack: [],

  crewAssignments: saved?.crewAssignments || INITIAL_CREW,
  missionDurationDays: saved?.missionDurationDays || 8,
  systemTestsPassed: saved?.systemTestsPassed || false,

  launchSnapshot: saved?.launchSnapshot || null,
  ascentProgress: 0,
  isAscentPaused: false,

  comingSoon: {
    isOpen: false,
    title: '',
    description: ''
  },
  isSourcesDrawerOpen: false,
  isManifestModalOpen: false,
  audioSettings: saved?.audioSettings || {
    isMuted: true,
    captionsEnabled: true,
    reducedMotion: false
  },

  setPhase: (phase) => {
    sound.playClick(650);
    set({ currentPhase: phase });
    saveState(get());
  },

  selectDestination: (id) => {
    sound.playClick(720);
    set({ selectedDestination: id });
    saveState(get());
  },

  selectMission: (id) => {
    sound.playClick(720);
    set({ selectedMission: id });
    saveState(get());
  },

  selectSite: (id) => {
    sound.playClick(720);
    set({ selectedSite: id });
    saveState(get());
  },

  setAssemblyViewMode: (mode) => {
    sound.playClick(600);
    set({ assemblyViewMode: mode, selectedSlotId: null });
  },

  toggleExplodedView: () => {
    sound.playClick(850);
    set((state) => ({ isExplodedView: !state.isExplodedView }));
  },

  selectSlot: (slotId) => {
    if (slotId) sound.playClick(750);
    set({ selectedSlotId: slotId });
  },

  selectPart: (partId) => {
    if (partId) sound.playClick(750);
    set({ selectedPartId: partId });
  },

  setDraggingPartId: (partId) => {
    set({ isDraggingPartId: partId });
  },

  installPart: (slotId, partId) => {
    const current = get().installedParts;
    const currentPartAtSlot = current[slotId];
    if (currentPartAtSlot === partId) return;

    // Check if slot accepts this part
    const slot = SLOTS.find((s) => s.id === slotId);
    const part = PARTS[partId];
    if (!slot || !part || currentPartAtSlot || Object.values(current).includes(partId) ||
      !part.compatibleSlots.includes(slotId) || !slot.acceptedCategories.includes(part.category) ||
      (slot.acceptedPartIds && !slot.acceptedPartIds.includes(partId))) return;

    // Push current to undo stack
    const undoStack = [...get().undoStack, { ...current }];

    sound.playClick(950);
    const updated = {
      ...current,
      [slotId]: partId
    };

    set({
      installedParts: updated,
      undoStack,
      redoStack: [],
      selectedSlotId: slotId,
      selectedPartId: partId,
      isDraggingPartId: null,
      systemTestsPassed: false
    });
    saveState(get());
  },

  installBatch: (partIds) => {
    const before = get().installedParts;
    const updated = { ...before };
    const installed: string[] = [];
    const skipped: string[] = [];

    for (const partId of [...new Set(partIds)]) {
      const part = PARTS[partId];
      if (!part || Object.values(updated).includes(partId)) {
        skipped.push(partId);
        continue;
      }
      const target = part.compatibleSlots.find((slotId) => {
        const slot = SLOTS.find((candidate) => candidate.id === slotId);
        return Boolean(slot && !updated[slotId] && slot.acceptedCategories.includes(part.category) &&
          (!slot.acceptedPartIds || slot.acceptedPartIds.includes(partId)));
      });
      if (!target) {
        skipped.push(partId);
        continue;
      }
      updated[target] = partId;
      installed.push(partId);
    }

    if (installed.length) {
      sound.playSnap();
      set({
        installedParts: updated,
        undoStack: [...get().undoStack, { ...before }],
        redoStack: [],
        selectedPartId: installed[installed.length - 1],
        selectedSlotId: (Object.entries(updated).find(([, id]) => id === installed[installed.length - 1])?.[0] as SlotInterface | undefined) ?? null,
        isDraggingPartId: null,
        systemTestsPassed: false
      });
      saveState(get());
    }
    return { installed, skipped };
  },

  replacePart: (slotId, partId) => {
    const current = get().installedParts;
    const slot = SLOTS.find((item) => item.id === slotId);
    const part = PARTS[partId];
    if (!current[slotId] || !slot || !part || Object.values(current).includes(partId) ||
      !part.compatibleSlots.includes(slotId) || !slot.acceptedCategories.includes(part.category) ||
      (slot.acceptedPartIds && !slot.acceptedPartIds.includes(partId))) return;

    set({
      installedParts: { ...current, [slotId]: partId },
      undoStack: [...get().undoStack, { ...current }],
      redoStack: [],
      selectedSlotId: slotId,
      selectedPartId: partId,
      isDraggingPartId: null,
      systemTestsPassed: false
    });
    saveState(get());
  },

  uninstallPart: (slotId) => {
    const current = get().installedParts;
    if (!current[slotId]) return;

    const undoStack = [...get().undoStack, { ...current }];
    const updated = { ...current };
    delete updated[slotId];

    sound.playClick(500);
    set({
      installedParts: updated,
      undoStack,
      redoStack: [],
      selectedSlotId: null,
      systemTestsPassed: false
    });
    saveState(get());
  },

  undo: () => {
    const { undoStack, installedParts, redoStack } = get();
    if (undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const newRedoStack = [...redoStack, { ...installedParts }];

    sound.playClick(520);
    set({
      installedParts: previous,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      systemTestsPassed: false
    });
    saveState(get());
  },

  redo: () => {
    const { redoStack, installedParts, undoStack } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    const newUndoStack = [...undoStack, { ...installedParts }];

    sound.playClick(820);
    set({
      installedParts: next,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      systemTestsPassed: false
    });
    saveState(get());
  },

  assignCrew: (role, candidateId) => {
    const candidate = CANDIDATES.find(c => c.id === candidateId);
    if (!candidate || (candidate.primaryRole !== role && candidate.secondaryRole !== role)) return;
    sound.playClick(800);
    set((state) => {
      // Remove candidate from other roles if already assigned
      const updated = { ...state.crewAssignments };
      (Object.keys(updated) as CrewRole[]).forEach((r) => {
        if (updated[r] === candidateId) {
          updated[r] = null;
        }
      });
      updated[role] = candidateId;
      return { crewAssignments: updated };
    });
    saveState(get());
  },

  unassignCrew: (role) => {
    sound.playClick(500);
    set((state) => {
      const updated = { ...state.crewAssignments, [role]: null };
      return { crewAssignments: updated };
    });
    saveState(get());
  },

  setMissionDurationDays: (days) => {
    const missionDurationDays = Math.max(8, Math.min(21, Math.round(days)));
    set({ missionDurationDays });
    saveState(get());
  },

  applyQuickLaunchManifest: () => {
    sound.playRadioBeep(true);
    set({
      selectedDestination: 'moon',
      selectedMission: 'lunar-ice-explorer',
      selectedSite: 'ridge',
      installedParts: { ...QUICK_LAUNCH_INSTALLED_PARTS },
      crewAssignments: { ...QUICK_LAUNCH_CREW },
      missionDurationDays: 8
    });
    saveState(get());
  },

  applyStoryBuild: () => {
    sound.playRadioBeep(true);
    set({
      installedParts: { ...STORY_BUILD_INSTALLED_PARTS },
      undoStack: [],
      redoStack: [],
      selectedPartId: null,
      selectedSlotId: null,
      systemTestsPassed: false
    });
    saveState(get());
  },

  completeSystemTests: () => {
    sound.playRadioBeep(true);
    set({ systemTestsPassed: true });
    saveState(get());
  },

  prepareLaunch: () => {
    const state = get();
    if (!state.systemTestsPassed) return false;
    if (!validateLaunchReadiness(state.selectedMission, state.selectedSite, state.installedParts, state.crewAssignments, state.missionDurationDays).isClearToLaunch) return false;
    const budget = computeBudgetAccounting(state.installedParts);
    const mass = computeMassAccounting(state.installedParts, state.crewAssignments, state.missionDurationDays);

    const snapshot: LaunchSnapshot = {
      timestamp: Date.now(),
      missionId: state.selectedMission,
      siteId: state.selectedSite,
      installedParts: { ...(state.installedParts as Record<SlotInterface, string>) },
      crewAssignments: { ...(state.crewAssignments as Record<CrewRole, string>) },
      totalDiscretionaryCost: budget.discretionarySpentDollars,
      scienceMassKg: mass.sciencePayloadMassKg,
      grossLiftoffMassKg: mass.launchStackTotalLiftoffMassKg,
      missionDurationDays: state.missionDurationDays,
      profileId: 'saturn-v-polar-insertion'
    };

    set({ launchSnapshot: snapshot, ascentProgress: 0, isAscentPaused: false });
    saveState(get());
    return true;
  },

  setAscentProgress: (progress) => {
    set({ ascentProgress: Math.max(0, Math.min(1, progress)) });
  },

  toggleAscentPause: () => {
    set((state) => ({ isAscentPaused: !state.isAscentPaused }));
  },

  resetAscent: () => {
    set({ ascentProgress: 0, isAscentPaused: false });
  },

  returnToHangar: () => {
    sound.playClick(600);
    set({ currentPhase: 'assembly' });
    saveState(get());
  },

  resetMission: () => {
    sound.playClick(400);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    set({
      currentPhase: 'welcome',
      selectedDestination: 'moon',
      selectedMission: 'lunar-ice-explorer',
      selectedSite: 'ridge',
      installedParts: {},
      crewAssignments: { ...INITIAL_CREW },
      missionDurationDays: 8,
      systemTestsPassed: false,
      selectedPartId: null, selectedSlotId: null, isDraggingPartId: null,
      undoStack: [], redoStack: [], assemblyViewMode: 'fullStack',
      launchSnapshot: null,
      ascentProgress: 0,
      isAscentPaused: false
    });
  },

  openComingSoon: (title, description) => {
    sound.playClick(600);
    set({ comingSoon: { isOpen: true, title, description } });
  },

  closeComingSoon: () => {
    sound.playClick(500);
    set({ comingSoon: { isOpen: false, title: '', description: '' } });
  },

  toggleSourcesDrawer: (open) => {
    sound.playClick(700);
    set((state) => ({
      isSourcesDrawerOpen: open !== undefined ? open : !state.isSourcesDrawerOpen
    }));
  },

  toggleManifestModal: (open) => {
    sound.playClick(700);
    set((state) => ({
      isManifestModalOpen: open !== undefined ? open : !state.isManifestModalOpen
    }));
  },

  toggleMute: () => {
    const newMuted = !get().audioSettings.isMuted;
    sound.setMuted(newMuted);
    set((state) => ({
      audioSettings: { ...state.audioSettings, isMuted: newMuted }
    }));
    saveState(get());
  },

  toggleCaptions: () => {
    set((state) => ({
      audioSettings: {
        ...state.audioSettings,
        captionsEnabled: !state.audioSettings.captionsEnabled
      }
    }));
    saveState(get());
  },

  toggleReducedMotion: () => {
    set((state) => ({
      audioSettings: {
        ...state.audioSettings,
        reducedMotion: !state.audioSettings.reducedMotion
      }
    }));
    saveState(get());
  }
}));

// Mission Forge - Unified Mission State Machine and Persistence Store
import { create } from 'zustand';
import { sound } from '../audio/soundEngine';
import { QUICK_LAUNCH_CREW, QUICK_LAUNCH_INSTALLED_PARTS } from '../data/defaultManifest';
import { PARTS, SLOTS } from '../data/parts';
import { computeBudgetAccounting, computeMassAccounting } from '../engine/accounting';
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

const STORAGE_KEY = 'mission_forge_save_v1';

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
  uninstallPart: (slotId: SlotInterface) => void;
  undo: () => void;
  redo: () => void;

  // Crew Actions
  assignCrew: (role: CrewRole, candidateId: string) => void;
  unassignCrew: (role: CrewRole) => void;

  // Flight Actions
  applyQuickLaunchManifest: () => void;
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

// Initial partially configured assembly (structural stack installed, core slots ready, science slots open)
const INITIAL_INSTALLED_PARTS: Partial<Record<SlotInterface, string>> = {
  'booster-stage-1': 'stage-1-booster',
  'interstage-1': 'interstage-1-2',
  'booster-stage-2': 'stage-2-cryo',
  'interstage-2': 'interstage-2-3',
  'booster-stage-3': 'stage-3-departure',
  'instrument-unit': 'instrument-unit-ring',
  'lunar-payload-bay': 'stowed-lunar-payload',
  'service-module': 'service-module-core',
  'crew-capsule': 'crew-capsule-command',
  'launch-escape-system': 'launch-escape-tower',
  'eclss-bay': 'eclss-primary-scrubber',
  'avionics-bay': 'primary-flight-avionics',
  'power-bay': 'fuel-cell-power-bus',
  'comms-mast': 'high-gain-comm-array'
  // Science and upgrades left open for player decision!
};

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
    return JSON.parse(raw);
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
  assemblyViewMode: 'sciencePayload',
  isExplodedView: false,
  selectedSlotId: null,
  selectedPartId: null,
  isDraggingPartId: null,

  undoStack: [],
  redoStack: [],

  crewAssignments: saved?.crewAssignments || INITIAL_CREW,

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
    isMuted: false,
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
    if (!slot || !part) return;

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
      isDraggingPartId: null
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
      selectedSlotId: null
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
      redoStack: newRedoStack
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
      redoStack: newRedoStack
    });
    saveState(get());
  },

  assignCrew: (role, candidateId) => {
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

  applyQuickLaunchManifest: () => {
    sound.playRadioBeep(true);
    set({
      selectedDestination: 'moon',
      selectedMission: 'lunar-ice-explorer',
      selectedSite: 'ridge',
      installedParts: { ...QUICK_LAUNCH_INSTALLED_PARTS },
      crewAssignments: { ...QUICK_LAUNCH_CREW }
    });
    saveState(get());
  },

  prepareLaunch: () => {
    const state = get();
    const budget = computeBudgetAccounting(state.installedParts);
    const mass = computeMassAccounting(state.installedParts, state.crewAssignments);

    const snapshot: LaunchSnapshot = {
      timestamp: Date.now(),
      missionId: state.selectedMission,
      siteId: state.selectedSite,
      installedParts: { ...(state.installedParts as Record<SlotInterface, string>) },
      crewAssignments: { ...(state.crewAssignments as Record<CrewRole, string>) },
      totalDiscretionaryCost: budget.discretionarySpentDollars,
      scienceMassKg: mass.sciencePayloadMassKg,
      grossLiftoffMassKg: mass.launchStackTotalLiftoffMassKg,
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
    localStorage.removeItem(STORAGE_KEY);
    set({
      currentPhase: 'welcome',
      selectedDestination: 'moon',
      selectedMission: 'lunar-ice-explorer',
      selectedSite: 'ridge',
      installedParts: INITIAL_INSTALLED_PARTS,
      crewAssignments: INITIAL_CREW,
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

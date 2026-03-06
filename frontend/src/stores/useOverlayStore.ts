import { create } from "zustand";

interface OverlayState {
  /** Number of active overlays (modals/sheets) that should hide the bottom nav */
  overlayCount: number;
  pushOverlay: () => void;
  popOverlay: () => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  overlayCount: 0,
  pushOverlay: () => set((s) => ({ overlayCount: s.overlayCount + 1 })),
  popOverlay: () => set((s) => ({ overlayCount: Math.max(0, s.overlayCount - 1) })),
}));

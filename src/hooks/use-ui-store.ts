
'use client';

import { create } from 'zustand';

interface UIState {
  isCameraActive: boolean;
  setIsCameraActive: (isActive: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCameraActive: false,
  setIsCameraActive: (isActive) => set({ isCameraActive: isActive }),
}));

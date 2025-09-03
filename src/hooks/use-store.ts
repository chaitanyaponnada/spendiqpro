
'use client';

import * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from './use-auth';
import { auth } from '@/lib/firebase';
import { useAuth } from './use-auth';

interface StoreState {
  storeId: string | null;
  setStoreId: (storeId: string | null) => void;
  isInitialized: boolean;
  initialize: (user: UserProfile | null) => void;
}

const getStorageKey = () => `spendwise-store-selection-${auth.currentUser?.uid || 'guest'}`;

const useStoreInternal = create<StoreState>()(
  persist(
    (set) => ({
      storeId: null,
      isInitialized: false,
      setStoreId: (storeId) => set({ storeId }),
      initialize: (user) => {
        if (user?.role === 'store-owner') {
          // Store owners have a fixed store ID associated with their account
           set({ storeId: (user as any).storeId || null, isInitialized: true });
        } else {
           // For customers, the storeId from localStorage (via persist) is used.
           // We just mark it as initialized. The persisted value will be loaded automatically.
           set({ isInitialized: true });
        }
      },
    }),
    {
      name: getStorageKey(),
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ storeId: state.storeId }),
      // We will manually rehydrate to ensure logic runs at the right time.
      skipHydration: true, 
    }
  )
);

export function useStore() {
    const { user, loading: authLoading } = useAuth();
    const state = useStoreInternal();

    React.useEffect(() => {
        // This effect ensures rehydration and initialization happens on auth state changes.
        const unsubscribe = auth.onAuthStateChanged(newUser => {
             useStoreInternal.persist.setOptions({ name: getStorageKey() });
             // Manually rehydrate from storage before initializing
             useStoreInternal.persist.rehydrate().then(() => {
                 state.initialize(newUser as UserProfile | null);
             });
        });
        return () => unsubscribe();
    }, [state.initialize]);

    React.useEffect(() => {
        // This handles the initial load case
        if (!authLoading && !state.isInitialized) {
            state.initialize(user);
        }
    }, [user, authLoading, state.isInitialized, state.initialize]);
    
    // For store owners, their storeId is not from local storage but from their user profile.
    const storeId = user?.role === 'store-owner' ? (user as any).storeId : state.storeId;
    const loading = authLoading || !state.isInitialized;

    return {
        storeId,
        loading,
        setStoreId: state.setStoreId,
    };
}

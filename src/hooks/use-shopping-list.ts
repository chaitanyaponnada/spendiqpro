

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ShoppingListItem } from '@/types';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from './use-toast';
import * as React from 'react';

export interface PastList {
  id: string;
  savedAt: Timestamp;
  items: ShoppingListItem[];
}

interface ShoppingListState {
  todayList: ShoppingListItem[];
  pastLists: PastList[];
  isPastListLoading: boolean;
  setTodayList: (items: string[]) => void;
  addManualItem: (itemName: string) => void;
  clearTodayList: () => void;
  toggleItemChecked: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  updateItemName: (itemId: string, newName: string) => void;
  syncWithCart: (cartItemNames: string[]) => void;
  fetchPastLists: (userId: string) => Promise<void>;
  _hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
}

const getStorageKey = () => `spendwise-shopping-list-${auth.currentUser?.uid || 'guest'}`;

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set, get) => ({
      todayList: [],
      pastLists: [],
      isPastListLoading: false,
      _hydrated: false,
      
      setHydrated: (hydrated) => set({ _hydrated: hydrated }),
      
      setTodayList: (items) => {
        const newList = items.map((item, index) => ({
          id: `${item.replace(/\s+/g, '-')}-${Date.now()}-${index}`,
          name: item,
          checked: false,
        }));
        set({ todayList: newList });
      },
      
      addManualItem: (itemName) => {
        const newItem: ShoppingListItem = {
            id: `${itemName.replace(/\s+/g, '-')}-${Date.now()}`,
            name: itemName,
            checked: false,
        };
        set(state => ({ todayList: [...state.todayList, newItem] }));
      },

      clearTodayList: () => set({ todayList: [] }),
      
      toggleItemChecked: (itemId) => {
        set((state) => ({
          todayList: state.todayList.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        }));
      },

      deleteItem: (itemId) => {
        set((state) => ({
            todayList: state.todayList.filter(item => item.id !== itemId),
        }));
      },

      updateItemName: (itemId, newName) => {
        set((state) => ({
            todayList: state.todayList.map(item => 
                item.id === itemId ? { ...item, name: newName } : item
            ),
        }));
      },
      
      syncWithCart: (cartItemNames) => {
        const lowercasedCartNames = cartItemNames.map(name => name.toLowerCase());
        set((state) => ({
          todayList: state.todayList.map((item) => {
            if (!item.checked && lowercasedCartNames.includes(item.name.toLowerCase())) {
              return { ...item, checked: true };
            }
            return item;
          }),
        }));
      },

      fetchPastLists: async (userId) => {
        if (!userId) return;
        set({ isPastListLoading: true });
        try {
          const listsQuery = query(
            collection(db, 'shoppingLists'),
            where('userId', '==', userId),
            orderBy('savedAt', 'desc')
          );
          const querySnapshot = await getDocs(listsQuery);
          const lists = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as PastList));
          set({ pastLists: lists });
        } catch (error) {
          console.error("Error fetching past lists:", error);
          // Errors are handled in the component via a toast.
          set({ pastLists: [] });
        } finally {
            set({ isPastListLoading: false });
        }
      },
    }),
    {
      name: getStorageKey(),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
      partialize: (state) => ({
        todayList: state.todayList,
      }),
    }
  )
);

const initializeListSync = () => {
    auth.onAuthStateChanged(user => {
      useShoppingListStore.persist.setOptions({ name: getStorageKey() });
      useShoppingListStore.persist.rehydrate();
    });
};

if (typeof window !== 'undefined') {
    initializeListSync();
}

export const useShoppingList = () => {
    const store = useShoppingListStore();
    const { toast } = useToast();

    const fetchPastLists = React.useCallback(async (userId: string) => {
        try {
            await store.fetchPastLists(userId);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error Fetching Past Lists',
                description: 'Could not fetch your saved shopping lists.'
            });
        }
    }, [store.fetchPastLists, toast]);
    
    React.useEffect(() => {
       useShoppingListStore.persist.rehydrate();
    }, [])

    if (!store._hydrated) {
        return {
            todayList: [],
            pastLists: [],
            isPastListLoading: true,
            setTodayList: () => {},
            addManualItem: () => {},
            clearTodayList: () => {},
            toggleItemChecked: () => {},
            deleteItem: () => {},
            updateItemName: () => {},
            syncWithCart: () => {},
            fetchPastLists: async () => {},
            isHydrated: false,
        };
    }

    return { ...store, fetchPastLists, isHydrated: true };
}

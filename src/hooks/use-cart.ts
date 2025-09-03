
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';
import { auth } from '@/lib/firebase';
import * as React from 'react';
import * as gtag from '@/lib/gtag';

interface CartState {
  cart: CartItem[];
  totalBudget: number;
  isBudgetSet: boolean;
  isBudgetModalOpen: boolean;
  pendingProduct: Product | null;
  addToCart: (product: Product) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, change: number) => boolean;
  clearCart: () => void;
  setBudget: (newBudget: number, retainSpent: boolean, isSet?: boolean) => void;
  clearAllData: () => void;
  openBudgetModal: (product: Product) => void;
  closeBudgetModal: () => void;
  _hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
}

const getStorageKey = () => `spendwise-cart-storage-${auth.currentUser?.uid || 'guest'}`;

// This is the core Zustand store.
const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      totalBudget: 0,
      spentAmount: 0,
      isBudgetSet: false,
      isBudgetModalOpen: false,
      pendingProduct: null,
      _hydrated: false,
      setHydrated: (hydrated) => set({ _hydrated: hydrated }),
      
      addToCart: (product) => {
         // **Definitive Fix**: Sanitize the product data at the point of entry.
        const sanitizedProduct: Product = {
            id: product.id || '',
            name: product.name || 'Unnamed Product',
            brand: product.brand || 'Unknown Brand',
            category: product.category || 'Uncategorized',
            price: typeof product.price === 'number' ? product.price : 0,
            barcode: product.barcode || '',
            originalPrice: product.originalPrice || null,
            description: product.description || null,
            imageUrl: product.imageUrl || null,
            storeId: product.storeId || '',
        };

        const { cart, totalBudget, isBudgetSet } = get();
        const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const newTotalPrice = totalPrice + sanitizedProduct.price;

        if (isBudgetSet && totalBudget > 0 && newTotalPrice > totalBudget) {
            get().openBudgetModal(sanitizedProduct);
            return false; // Indicate failure
        }
        
        gtag.event({
            action: 'add_to_cart',
            category: 'ecommerce',
            label: sanitizedProduct.name,
            value: sanitizedProduct.price
        });

        const existingItem = cart.find((item) => item.id === sanitizedProduct.id);
        if (existingItem) {
          set((state) => ({
            cart: state.cart.map((item) =>
              item.id === sanitizedProduct.id ? { ...item, quantity: item.quantity + 1 } : item
            )
          }));
        } else {
          set((state) => ({
            cart: [...state.cart, { ...sanitizedProduct, quantity: 1 }]
          }));
        }
        return true; // Indicate success
      },
      
      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== productId),
        }));
      },

      updateQuantity: (productId, change) => {
        const { cart, totalBudget, isBudgetSet } = get();
        const itemToUpdate = cart.find(item => item.id === productId);
        if (!itemToUpdate) return true; // No item, no failure
        
        // Prevent update if it would exceed budget
        if (change > 0) {
            const currentTotalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            const newTotalPrice = currentTotalPrice + (itemToUpdate.price * change);
            if (isBudgetSet && totalBudget > 0 && newTotalPrice > totalBudget) {
                get().openBudgetModal(itemToUpdate);
                return false; // Indicate failure
            }
        }

        const newQuantity = itemToUpdate.quantity + change;
        if (newQuantity <= 0) {
          get().removeFromCart(productId);
        } else {
          set(state => ({
            cart: state.cart.map(item =>
              item.id === productId ? { ...item, quantity: newQuantity } : item
            ),
          }));
        }
        return true; // Indicate success
      },
      
      clearCart: () => set({ cart: [] }),
      
      setBudget: (newBudget, retainSpent, isSet = true) => {
        const { pendingProduct } = get();
        
        set({
            totalBudget: newBudget,
            isBudgetSet: isSet,
            isBudgetModalOpen: false, // Close modal on budget set
            pendingProduct: null,
        })
        if (!retainSpent) {
            get().clearCart();
        }

        // After updating budget, retry adding the pending product if it exists
        if(pendingProduct) {
            get().addToCart(pendingProduct);
        }
      },
      
      clearAllData: () => set({ cart: [], totalBudget: 0, isBudgetSet: false }),

      openBudgetModal: (product: Product) => {
        set({ isBudgetModalOpen: true, pendingProduct: product });
      },

      closeBudgetModal: () => {
        set({ isBudgetModalOpen: false, pendingProduct: null });
      },
    }),
    {
      name: getStorageKey(),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true)
      },
       // Important: partialize to avoid storing functions
       partialize: (state) => ({
        cart: state.cart,
        totalBudget: state.totalBudget,
        isBudgetSet: state.isBudgetSet,
      }),
    }
  )
);

// This function handles dynamic storage key updates on auth state changes.
const initializeCartSync = () => {
    auth.onAuthStateChanged(user => {
      // Re-initialize the persist middleware with the new storage key.
      useCartStore.persist.setOptions({
          name: getStorageKey(),
      });
      // Manually re-hydrate the store with the new user's data
      useCartStore.persist.rehydrate();
    });
};

// Call this once at the top level of your app, e.g., in a layout component.
// To avoid issues with SSR, we ensure it only runs on the client.
if (typeof window !== 'undefined') {
    initializeCartSync();
}

// This is the public hook that components will use.
export const useCart = () => {
  const store = useCartStore();
  
  // This effect ensures that the store is hydrated on the first client-side render
  React.useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  const totalItems = store.cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = store.cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Return a stable, non-reactive state until the store is hydrated.
  if (!store._hydrated) {
    return {
      cart: [],
      totalBudget: 0,
      isBudgetSet: false,
      isBudgetModalOpen: false,
      pendingProduct: null,
      addToCart: () => false,
      removeFromCart: () => {},
      updateQuantity: () => false,
      clearCart: () => {},
      setBudget: () => {},
      clearAllData: () => {},
      openBudgetModal: () => {},
      closeBudgetModal: () => {},
      totalItems: 0,
      totalPrice: 0,
      isHydrated: false,
    };
  }

  return {
    ...store,
    totalItems,
    totalPrice,
    isHydrated: true,
  };
};

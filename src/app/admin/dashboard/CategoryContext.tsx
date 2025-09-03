
'use client';

import * as React from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/use-store';

interface CategoryContextType {
  categories: string[];
  addCategory: (categoryName: string) => Promise<void>;
  loading: boolean;
}

const CategoryContext = React.createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const { storeId } = useStore();

  React.useEffect(() => {
    if (!storeId) {
        setLoading(false);
        return;
    };

    const storeDocRef = doc(db, 'stores', storeId);

    const unsubscribe = onSnapshot(storeDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const storeCategories = data.categories || [];
        const sortedList = storeCategories.sort((a: string, b: string) => a.localeCompare(b));
        setCategories(sortedList);
      } else {
        // This case should ideally not happen for a logged-in store owner
        console.error("Store document not found!");
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not find your store data.',
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch product categories.',
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storeId, toast]);

  const addCategory = async (categoryName: string) => {
    const trimmedName = categoryName.trim();
    if (trimmedName === '') {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'Category name cannot be empty.' });
      return;
    }
    
    if (!storeId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Store context not found.' });
      return;
    }

    const lowerCaseCategories = categories.map(c => c.toLowerCase());
    if (lowerCaseCategories.includes(trimmedName.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Duplicate Category', description: 'This category already exists.' });
        return;
    }

    const storeDocRef = doc(db, 'stores', storeId);
    try {
        await updateDoc(storeDocRef, {
            categories: arrayUnion(trimmedName)
        });
        toast({ title: 'Category Added!', description: `"${trimmedName}" is now available.` });
    } catch (error: any) {
        console.error("Error adding category:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add the new category.' });
    }
  };

  return (
    <CategoryContext.Provider value={{ categories, addCategory, loading }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = React.useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}

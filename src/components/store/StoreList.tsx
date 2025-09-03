
'use client';

import * as React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Store } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, Store as StoreIcon } from 'lucide-react';

interface StoreListProps {
  onSelectStore: (storeId: string) => void;
  currentStoreId?: string | null;
}

export function StoreList({ onSelectStore, currentStoreId }: StoreListProps) {
  const [stores, setStores] = React.useState<Store[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true);
      try {
        const storesCollection = collection(db, 'stores');
        const storesSnapshot = await getDocs(storesCollection);
        const storesList = storesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Store));
        setStores(storesList);
      } catch (error) {
        console.error("Error fetching stores: ", error);
        // Handle error display to the user if necessary
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stores.map(store => (
        <Button
          key={store.id}
          variant={store.id === currentStoreId ? 'default' : 'outline'}
          className="w-full h-auto py-4 flex flex-col items-start text-left"
          onClick={() => onSelectStore(store.id)}
          disabled={store.id === currentStoreId}
        >
          <div className="flex items-center gap-3">
            <StoreIcon className="h-5 w-5 text-primary" />
            <span className="font-bold">{store.name}</span>
          </div>
          <p className="text-sm text-muted-foreground ml-8">{store.address}</p>
        </Button>
      ))}
    </div>
  );
}

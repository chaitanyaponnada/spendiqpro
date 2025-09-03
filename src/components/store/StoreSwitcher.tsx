
'use client';

import * as React from 'react';
import { useStore } from '@/hooks/use-store';
import { useCart } from '@/hooks/use-cart';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Store } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { StoreList } from './StoreList';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

export function StoreSwitcher() {
  const { storeId, setStoreId } = useStore();
  const { clearAllData } = useCart();
  const [currentStore, setCurrentStore] = React.useState<Store | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!storeId) return;

    const fetchCurrentStore = async () => {
      setIsLoading(true);
      const storeDocRef = doc(db, 'stores', storeId);
      const docSnap = await getDoc(storeDocRef);
      if (docSnap.exists()) {
        setCurrentStore({ id: docSnap.id, ...docSnap.data() } as Store);
      }
      setIsLoading(false);
    };

    fetchCurrentStore();
  }, [storeId]);

  const handleStoreChange = (newStoreId: string) => {
    if (newStoreId !== storeId) {
      clearAllData(); // Clear cart and budget
      setStoreId(newStoreId);
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change store">
          <MapPin className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Store</DialogTitle>
          <DialogDescription>
            Select a new store to shop from. Your current cart will be cleared.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Alert className="mb-4">
                <MapPin className="h-4 w-4" />
                <AlertTitle>Current Store</AlertTitle>
                <AlertDescription>
                    {isLoading ? <Skeleton className="h-5 w-3/4" /> : currentStore?.name || "No store selected"}
                </AlertDescription>
            </Alert>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Available Stores</h4>
            <StoreList onSelectStore={handleStoreChange} currentStoreId={storeId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

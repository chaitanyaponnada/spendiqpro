
'use client';

import * as React from 'react';
import { useStore } from '@/hooks/use-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SpendIQLogo from '../SpendIQLogo';
import { StoreList } from './StoreList';

export function StoreSelectionGate() {
  const { setStoreId } = useStore();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <SpendIQLogo/>
            <CardTitle className="text-2xl">Select Your Store</CardTitle>
            <CardDescription>Choose the store you are shopping at today.</CardDescription>
        </CardHeader>
        <CardContent>
          <StoreList onSelectStore={setStoreId} />
        </CardContent>
      </Card>
    </div>
  );
}

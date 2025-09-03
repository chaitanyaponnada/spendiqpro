
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/hooks/use-store';
import { StoreSelectionGate } from '../store/StoreSelectionGate';

interface AuthWrapperProps {
    children: React.ReactNode;
    nav?: boolean;
}

export default function AuthWrapper({ children, nav = true }: AuthWrapperProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { storeId, loading: storeLoading } = useStore();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    // If auth has loaded and there's no user, redirect to login.
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  if (!isClient || authLoading || storeLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <div className="w-full max-w-md mx-auto space-y-6">
              <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-64 w-full" />
          </div>
      </div>
    );
  }

  // After loading, if there's a user, check their role and store selection.
  if (user) {
    // If the user is a customer but has NOT selected a store, show the selection gate.
    if (user.role === 'customer' && !storeId) {
      return <StoreSelectionGate />;
    }
    // If the user is a store owner OR a customer with a selected store, show the children.
    return <>{children}</>;
  }

  // If there's no user and we're not loading, it means we are about to redirect.
  // Render a loading state to prevent a flash of content.
  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <div className="w-full max-w-md mx-auto space-y-6">
              <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-64 w-full" />
          </div>
      </div>
  );
}

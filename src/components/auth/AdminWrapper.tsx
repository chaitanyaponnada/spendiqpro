
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function AdminWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(true);

  React.useEffect(() => {
    if (loading) {
      return; // Wait for auth state to be confirmed
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    const verifyRole = async () => {
      try {
        // The useAuth hook now provides the role directly
        if (user.role === 'store-owner') {
          setIsAuthorized(true);
        } else {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to view this page.',
          });
          router.replace('/');
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Verification Error',
          description: 'Could not verify your user role.',
        });
        router.replace('/');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyRole();

  }, [user, loading, router, toast]);

  if (isVerifying || loading || !isAuthorized) {
    // Show a loading skeleton while we verify auth and role state
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <div className="w-full max-w-2xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-96 w-full" />
          </div>
      </div>
    );
  }

  return <>{children}</>;
}

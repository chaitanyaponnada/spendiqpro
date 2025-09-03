
'use client';

import * as React from 'react';
import { Link, useRouter } from '@/lib/navigation';
import { ArrowLeft, ChevronRight, LogOut, User } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login'; // Use standard navigation for logout
  };

   const handleSupportClick = () => {
    toast({
        title: "Coming Soon!",
        description: "Our Help & Support center is currently under construction.",
    })
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-start mb-4 relative">
            <Link href="/" className="absolute">
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <h1 className="text-2xl font-bold text-center flex-grow">Settings</h1>
        </div>
        <Card>
          <CardHeader>
            <CardDescription>Manage your account details here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <Link href="/profile" className="w-full">
                    <Button variant="outline" className="w-full justify-between h-14 text-base">
                        <div className="flex items-center gap-4">
                           <User className="text-primary"/>
                           <span>Edit Profile</span>
                        </div>
                        <ChevronRight />
                    </Button>
                </Link>

                <Separator className="my-4" />
                
                <Button variant="destructive" className="w-full h-14 text-base" onClick={handleLogout}>
                    <LogOut className="mr-3"/>
                    Log Out
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default function WrappedSettingsPage() {
    return (
        <AuthWrapper>
            <SettingsPage />
        </AuthWrapper>
    )
}

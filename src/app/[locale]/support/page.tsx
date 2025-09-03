
'use client';

import * as React from 'react';
import { Link, useRouter } from '@/lib/navigation';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { SupportForm } from './SupportForm';

function SupportPage() {
    const router = useRouter();
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-start mb-4 relative">
            <Link href="/" className="absolute">
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <h1 className="text-2xl font-bold text-center flex-grow">Help & Support</h1>
        </div>
        <Card>
          <CardHeader>
            <CardDescription>
              Having an issue? Fill out the form below and our team will get back to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupportForm onTicketSubmitted={() => router.push('/')}/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function WrappedSupportPage() {
    return (
        <AuthWrapper>
            <SupportPage />
        </AuthWrapper>
    )
}


'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/hooks/use-ui-store';

export default function MainContent({ children }: { children: React.ReactNode }) {
    const { isCameraActive } = useUIStore();
    
    // The bottom navigation is now handled directly by the pages that need it.
    // This component is now just a simple wrapper.
    // The pb-20 (padding-bottom) is also handled by the page component.

    return (
        <div className={cn("flex flex-col min-h-screen")}>
            <main className="flex-grow">
                {children}
            </main>
        </div>
    )
}

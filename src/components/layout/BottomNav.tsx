
'use client';

import * as React from 'react';
import { Home, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/navigation';


export default function BottomNav() {
    const t = useTranslations('BottomNav');
    const pathname = usePathname();
    
    // remove locale from pathname
    const currentPath = pathname;

    const navItems = [
        { href: '/', label: t('home'), icon: Home },
        { href: '/list', label: t('list'), icon: ListChecks },
    ];


    return (
        <footer className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-lg border-t z-50">
            <nav className="flex h-full items-center justify-around max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = item.href === currentPath;
                    return (
                        <Link
                          href={item.href}
                          key={item.label}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 w-20 h-16 rounded-lg text-muted-foreground transition-all duration-200",
                            isActive ? "text-primary bg-primary/10" : "hover:text-primary"
                          )}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </footer>
    );
}

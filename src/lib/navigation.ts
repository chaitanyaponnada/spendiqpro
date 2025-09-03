
'use client';

// This file centralizes all navigation-related imports from next-intl.
// By re-exporting them from a single file, we ensure that the entire
// application uses the same, correctly-resolved navigation components,
// preventing conflicts between the standard Next.js router and the
// internationalized version from next-intl.

import {
  createLocalizedPathnamesNavigation,
  Pathnames,
} from 'next-intl/navigation';
import {locales} from '@/messages';

export const pathnames = {
  '/': '/',
  '/list': '/list',
  '/history': '/history',
  '/profile': '/profile',
  '/checkout': '/checkout',
  '/support': '/support',
  '/login': '/login',
  '/signup': '/signup'
} satisfies Pathnames<typeof locales>;

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createLocalizedPathnamesNavigation({
    locales,
    pathnames,
  });

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/game', label: 'Network', icon: 'network' },
  { href: '/agreements', label: 'Agreements', icon: 'agreements' },
  { href: '/profile', label: 'Profile', icon: 'profile' },
];

export function MainNav() {
  const pathname = usePathname();
  const { session, user, currentFounder } = useAppStore();
  
  if (!session || !user) {
    return null;
  }
  
  return (
    <nav className="flex items-center space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-primary'
              : 'text-gray-600 dark:text-gray-300'
          )}
        >
          {item.label}
        </Link>
      ))}
      
    </nav>
  );
}

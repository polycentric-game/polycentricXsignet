'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export const navItems = [
  { href: '/game', label: 'Network', icon: 'network' },
  { href: '/agreements', label: 'Agreements', icon: 'agreements' },
  { href: '/profile', label: 'Profile', icon: 'profile' },
];

interface MainNavProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export function MainNav({ isMobile = false, onLinkClick }: MainNavProps) {
  const pathname = usePathname();
  const { session, user, currentFounder } = useAppStore();
  
  if (!session || !user) {
    return null;
  }
  
  const linkClassName = (href: string) => cn(
    'text-sm font-medium transition-colors hover:text-primary block',
    pathname === href
      ? 'text-primary'
      : 'text-gray-600 dark:text-gray-300'
  );
  
  if (isMobile) {
    return (
      <nav className="flex flex-col space-y-4 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={linkClassName(item.href)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }
  
  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={linkClassName(item.href)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/game', label: 'Game' },
  { href: '/agreements', label: 'Agreements' },
  { href: '/profile', label: 'Profile' },
];

export function MainNav() {
  const pathname = usePathname();
  const { session, user, currentFounder, setSession } = useAppStore();
  
  const handleSignOut = () => {
    signOut();
    setSession(null, null);
    window.location.href = '/';
  };
  
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
      
      <div className="flex items-center space-x-2 ml-6 pl-6 border-l border-gray-200 dark:border-gray-700">
        {currentFounder && (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {currentFounder.founderName}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </nav>
  );
}

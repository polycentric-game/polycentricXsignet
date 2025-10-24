'use client';

import React, { useEffect } from 'react';
import { Inter } from 'next/font/google';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initializeApp } = useAppStore();
  
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <Card className="p-12">
        <div className="space-y-6">
          <div className="text-6xl font-bold text-primary">404</div>
          <h1 className="text-3xl font-space-grotesk font-bold text-gray-900 dark:text-gray-100">
            Page Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/game">
              <Button>Go to Network</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Back to Home</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

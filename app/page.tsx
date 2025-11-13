'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  const { session, currentFounder } = useAppStore();
  
  
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="font-space-grotesk font-bold text-4xl md:text-6xl text-gray-900 dark:text-gray-100">
          Welcome to{' '}
          <span className="text-primary">Polycentric</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          The equity swap negotiation game where founders create agreements to exchange equity between their companies.
        </p>
        <div className="flex justify-center space-x-4">
          {session ? (
            <Link href={currentFounder ? "/game" : "/create-founder"}>
              <Button size="lg">
                {currentFounder ? "Join Game" : "Create Profile"}
              </Button>
            </Link>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              Connect your wallet in the header to get started
            </p>
          )}
        </div>
      </div>
      
      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-primary" />
            </div>
            <h3 className="font-space-grotesk font-semibold text-xl text-gray-900 dark:text-gray-100">
              Create Your Profile
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Build your founder persona with company details, values, and equity availability.
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-primary" />
            </div>
            <h3 className="font-space-grotesk font-semibold text-xl text-gray-900 dark:text-gray-100">
              Negotiate Agreements
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Propose equity swaps, revise terms, and reach mutually beneficial agreements.
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-primary" />
            </div>
            <h3 className="font-space-grotesk font-semibold text-xl text-gray-900 dark:text-gray-100">
              Visualize Network
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Explore the interactive graph of founders and their equity relationships.
            </p>
          </div>
        </Card>
      </div>
      
      {/* How It Works */}
      <div className="space-y-8">
        <h2 className="font-space-grotesk font-bold text-3xl text-center text-gray-900 dark:text-gray-100">
          How It Works
        </h2>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-black font-bold flex items-center justify-center">
              1
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Connect Wallet & Create Profile
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect your Ethereum wallet, then create your founder profile with company details.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-black font-bold flex items-center justify-center">
              2
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Explore the Network
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browse the interactive graph to discover other founders and potential collaboration opportunities.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-black font-bold flex items-center justify-center">
              3
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Propose Equity Swaps
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create agreements offering your equity in exchange for equity from other companies.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-black font-bold flex items-center justify-center">
              4
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Negotiate & Finalize
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Revise terms, approve agreements, and export finalized contracts for real-world implementation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

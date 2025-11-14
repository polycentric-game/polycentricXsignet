'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useAppStore } from '@/lib/store';
import { AgreementStatus } from '@/lib/types';
import { GameGraph, GameGraphRef } from '@/components/graph/GameGraph';
import { GraphControls } from '@/components/graph/GraphControls';
import { AgreementForm } from '@/components/agreement/AgreementForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Plus } from 'lucide-react';

function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, address } = useAccount();
  const { session, user, currentFounder, founders, agreements, isLoading } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [highlightedFounder, setHighlightedFounder] = useState<string | undefined>(undefined);
  const graphRef = useRef<GameGraphRef>(null);
  
  useEffect(() => {
    // Wait for app to finish initializing
    if (isLoading) {
      return;
    }
    
    // If wallet is connected, we should have a session - wait a bit if needed
    if (isConnected && address) {
      if (!session || !user) {
        // Wait for Header to create session
        const timer = setTimeout(() => {
          const { session: currentSession, user: currentUser, currentFounder: currentFounderState } = useAppStore.getState();
          if (!currentSession || !currentUser) {
            // Still no session after waiting, something went wrong - redirect to home
            router.push('/');
          } else if (!currentFounderState) {
            // Session and user exist but no founder, redirect to create founder
            router.push('/create-founder');
          }
        }, 1500); // Give Header time to create session
        return () => clearTimeout(timer);
      } else if (!currentFounder) {
        // Have session and user but no founder - redirect to create founder
        router.push('/create-founder');
        return;
      }
      // All good - session, user, and founder exist
      return;
    }
    
    // If no wallet connected and no session, redirect to home
    if (!isConnected && !session) {
      router.push('/');
      return;
    }
    
    // If we have session but no user, something went wrong - redirect to home
    if (session && !user) {
      router.push('/');
      return;
    }
    
    // If we have session and user but no founder, redirect to create founder
    if (session && user && !currentFounder) {
      router.push('/create-founder');
      return;
    }
    
    // Check if we should auto-open create modal
    const createWith = searchParams.get('createWith');
    if (createWith && founders.find(f => f.id === createWith)) {
      setShowCreateModal(true);
      // Clear the query parameter
      router.replace('/game', { scroll: false });
    }
  }, [session, user, currentFounder, router, searchParams, founders, isConnected, address, isLoading]);
  
  // Show loading state while waiting for session or redirecting
  if (isLoading || !session || !user || !currentFounder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }
  
  // Filter agreements by status
  const filteredAgreements = statusFilter === 'all' 
    ? agreements 
    : agreements.filter(agreement => agreement.status === statusFilter);
  
  const handleCreateAgreement = () => {
    setShowCreateModal(true);
  };
  
  const handleAgreementCreated = (agreement: any) => {
    setShowCreateModal(false);
    router.push(`/agreement/${agreement.id}`);
  };

  const handleZoomReset = () => {
    if (graphRef.current) {
      graphRef.current.resetZoom();
    }
  };

  const handleCenterView = () => {
    if (graphRef.current) {
      graphRef.current.centerView();
    }
  };

  const handleNodeClick = (founderId: string) => {
    router.push(`/founder/${founderId}`);
  };

  const handleEdgeClick = (agreementId: string) => {
    router.push(`/agreement/${agreementId}`);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-space-grotesk font-bold text-3xl text-gray-900 dark:text-gray-100">
            Equity Network
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Explore founders and their equity relationships
          </p>
        </div>
        <Button onClick={handleCreateAgreement} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Propose Agreement</span>
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{founders.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Total Founders</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{agreements.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Total Agreements</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {agreements.filter(a => a.status === 'approved' || a.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Approved</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {agreements.filter(a => a.founderAId === currentFounder.id || a.founderBId === currentFounder.id).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Your Agreements</div>
        </Card>
      </div>
      
      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Graph Controls */}
        <div className="lg:col-span-1">
          <GraphControls
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onZoomReset={handleZoomReset}
            onCenterView={handleCenterView}
            highlightedFounder={highlightedFounder}
            onHighlightFounder={(founderId: string | null) => setHighlightedFounder(founderId || undefined)}
          />
        </div>
        
        {/* Graph */}
        <div className="lg:col-span-3">
          <Card className="p-0 overflow-hidden">
            <GameGraph
              ref={graphRef}
              founders={founders}
              agreements={filteredAgreements}
              currentFounderId={currentFounder.id}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
            />
          </Card>
        </div>
      </div>
      
      {/* Instructions */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
          How to Use the Network Graph
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-300">
          <div className="space-y-2">
            <div><strong>Nodes (Circles):</strong> Represent founders and their companies</div>
            <div><strong>Click a node:</strong> View founder profile and details</div>
            <div><strong>Drag nodes:</strong> Reposition them in the graph</div>
            <div><strong>Your node:</strong> Highlighted with a bright green border</div>
          </div>
          <div className="space-y-2">
            <div><strong>Edges (Lines):</strong> Represent equity swap agreements</div>
            <div><strong>Click an edge:</strong> View agreement details</div>
            <div><strong>Edge colors:</strong> Show agreement status (blue=proposed, yellow=revised, green=approved)</div>
            <div><strong>Zoom & Pan:</strong> Use mouse wheel and drag to navigate</div>
          </div>
        </div>
      </Card>
      
      {/* Propose Agreement Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Propose New Agreement"
        size="lg"
      >
        <AgreementForm
          onSubmit={handleAgreementCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GamePageContent />
    </Suspense>
  );
}

'use client';

import React from 'react';
import { AgreementStatus } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface GraphControlsProps {
  statusFilter: AgreementStatus | 'all';
  onStatusFilterChange: (status: AgreementStatus | 'all') => void;
  onZoomReset?: () => void;
  onCenterView?: () => void;
  highlightedFounder?: string;
  onHighlightFounder?: (founderId: string | null) => void;
}

const statusOptions: { value: AgreementStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'bg-gray-500' },
  { value: 'proposed', label: 'Proposed', color: 'bg-blue-500' },
  { value: 'revised', label: 'Revised', color: 'bg-yellow-500' },
  { value: 'approved', label: 'Approved', color: 'bg-primary' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
];

export function GraphControls({ 
  statusFilter, 
  onStatusFilterChange, 
  onZoomReset, 
  onCenterView,
  highlightedFounder,
  onHighlightFounder
}: GraphControlsProps) {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
            Filter by Status
          </h3>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onStatusFilterChange(option.value)}
                className="flex items-center space-x-2"
              >
                <div className={`w-3 h-3 rounded-full ${option.color}`} />
                <span>{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            View Controls
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {onZoomReset && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={onZoomReset}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </Button>
            )}
            {onCenterView && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={onCenterView}
                className="flex items-center space-x-1"
              >
                <Maximize2 className="h-3 w-3" />
                <span>Center</span>
              </Button>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div><strong>Mouse Controls:</strong></div>
            <div>• Scroll: Zoom in/out</div>
            <div>• Drag background: Pan view</div>
            <div>• Drag nodes: Reposition</div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div><strong>Node Colors:</strong></div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>High equity available (70%+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Medium equity available (30-70%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Low equity available (&lt;30%)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

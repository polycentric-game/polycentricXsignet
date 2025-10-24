// User (authentication)
export interface User {
  id: string;
  email?: string;
  ethereumAddress?: string;
  createdAt: string;
}

// Auth session
export interface AuthSession {
  userId: string;
  founderId?: string; // Current founder persona
  expiresAt: string;
}

// Founder (player profile)
export interface Founder {
  id: string;
  userId: string;
  founderName: string;
  founderType: string;
  founderValues: [string, string, string];
  companyName: string;
  companyDescription: string;
  stage: 'Pre-seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C';
  currentValuationRange: string;
  revenueStatus: string;
  businessModel: string;
  keyAssets: [string, string, string];
  swapMotivation: string;
  gapsOrNeeds: [string, string, string];
  totalEquityAvailable: number; // Percentage (0-100)
  equitySwapped: number; // Running total of committed equity
  createdAt: string;
  updatedAt: string;
}

// Agreement version (each revision creates new version)
export interface AgreementVersion {
  versionNumber: number; // 0, 1, 2, etc.
  equityFromCompanyA: number;
  equityFromCompanyB: number;
  notes: string;
  proposedBy: string; // founderId
  proposedAt: string;
  approvedBy: string[]; // Array of founderIds who approved
}

// Agreement (bilateral)
export type AgreementStatus = 'proposed' | 'revised' | 'approved' | 'completed';

export interface Agreement {
  id: string; // "A1", "A2", etc.
  founderAId: string;
  founderBId: string;
  status: AgreementStatus;
  initiatedBy: string; // founderId
  lastRevisedBy: string; // founderId
  currentVersion: number; // Index into versions array
  versions: AgreementVersion[];
  createdAt: string;
  updatedAt: string;
}

// Graph visualization
export interface GraphNode {
  id: string; // founderId
  founderName: string;
  companyName: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string; // agreementId
  source: string | GraphNode;
  target: string | GraphNode;
  status: AgreementStatus;
}

// Signet export format
export interface SignetExport {
  agreementId: string;
  exportedAt: string;
  parties: {
    companyA: {
      name: string;
      founder: string;
      equityOffered: number;
    };
    companyB: {
      name: string;
      founder: string;
      equityOffered: number;
    };
  };
  terms: {
    equitySwapPercentages: {
      companyAToB: number;
      companyBToA: number;
    };
    agreementNotes: string;
  };
  signatures: {
    founderA: {
      name: string;
      signedAt: string;
    };
    founderB: {
      name: string;
      signedAt: string;
    };
  };
  legalText: string; // Generated contract text
}

// Form validation
export interface ValidationError {
  field: string;
  message: string;
}

// Theme
export type Theme = 'light' | 'dark';

import { Founder } from './types';

// Dropdown options
export const FOUNDER_TYPES = [
  { value: 'Technical Founder', label: 'Technical Founder' },
  { value: 'Business Founder', label: 'Business Founder' },
  { value: 'Product Founder', label: 'Product Founder' },
  { value: 'Marketing Founder', label: 'Marketing Founder' },
  { value: 'Sales Founder', label: 'Sales Founder' },
  { value: 'Operations Founder', label: 'Operations Founder' },
];

export const COMPANY_STAGES = [
  { value: 'Pre-seed', label: 'Pre-seed' },
  { value: 'Seed', label: 'Seed' },
  { value: 'Series A', label: 'Series A' },
  { value: 'Series B', label: 'Series B' },
  { value: 'Series C', label: 'Series C' },
];

export const VALUATION_RANGES = [
  { value: '$0 - $1M', label: '$0 - $1M' },
  { value: '$1M - $5M', label: '$1M - $5M' },
  { value: '$5M - $10M', label: '$5M - $10M' },
  { value: '$10M - $25M', label: '$10M - $25M' },
  { value: '$25M - $50M', label: '$25M - $50M' },
  { value: '$50M - $100M', label: '$50M - $100M' },
  { value: '$100M+', label: '$100M+' },
];

export const REVENUE_STATUSES = [
  { value: 'Pre-revenue', label: 'Pre-revenue' },
  { value: '$0 - $10K MRR', label: '$0 - $10K MRR' },
  { value: '$10K - $50K MRR', label: '$10K - $50K MRR' },
  { value: '$50K - $100K MRR', label: '$50K - $100K MRR' },
  { value: '$100K+ MRR', label: '$100K+ MRR' },
];

export const BUSINESS_MODELS = [
  { value: 'SaaS', label: 'SaaS' },
  { value: 'Marketplace', label: 'Marketplace' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Other', label: 'Other' },
];

// Example founders for demo
export const EXAMPLE_FOUNDERS: Omit<Founder, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    founderName: 'Alex Chen',
    founderType: 'Technical Founder',
    founderValues: ['Innovation', 'Scalability', 'User Experience'],
    companyName: 'NeuralFlow',
    companyDescription: 'AI-powered analytics platform for enterprise data insights',
    stage: 'Seed',
    currentValuationRange: '$5M - $10M',
    revenueStatus: '$10K - $50K MRR',
    businessModel: 'SaaS',
    keyAssets: ['Proprietary ML algorithms', 'Enterprise partnerships', 'Technical team'],
    swapMotivation: 'Looking to expand into new markets and gain complementary expertise',
    gapsOrNeeds: ['Marketing expertise', 'Sales channels', 'Industry connections'],
    totalEquityAvailable: 10,
    equitySwapped: 0,
  },
  {
    founderName: 'Maya Patel',
    founderType: 'Business Founder',
    founderValues: ['Transparency', 'Decentralization', 'Financial Inclusion'],
    companyName: 'YieldBridge',
    companyDescription: 'DeFi protocol connecting traditional finance with decentralized markets',
    stage: 'Seed',
    currentValuationRange: '$10M - $25M',
    revenueStatus: '$50K - $100K MRR',
    businessModel: 'Fintech',
    keyAssets: ['DeFi protocols', 'Regulatory compliance', 'Financial partnerships'],
    swapMotivation: 'Seeking technical innovation and AI capabilities for better risk assessment',
    gapsOrNeeds: ['AI/ML expertise', 'Advanced analytics', 'Technical infrastructure'],
    totalEquityAvailable: 15,
    equitySwapped: 0,
  },
  {
    founderName: 'Jordan Kim',
    founderType: 'Product Founder',
    founderValues: ['Efficiency', 'Automation', 'Team Collaboration'],
    companyName: 'WorkflowPro',
    companyDescription: 'Project management and workflow automation platform for remote teams',
    stage: 'Series A',
    currentValuationRange: '$25M - $50M',
    revenueStatus: '$100K+ MRR',
    businessModel: 'SaaS',
    keyAssets: ['User base', 'Product-market fit', 'Brand recognition'],
    swapMotivation: 'Want to integrate financial tools and expand into new verticals',
    gapsOrNeeds: ['Fintech integration', 'Enterprise sales', 'International expansion'],
    totalEquityAvailable: 8,
    equitySwapped: 0,
  },
];

// Common founder values suggestions
export const FOUNDER_VALUES_SUGGESTIONS = [
  'Innovation',
  'Scalability',
  'User Experience',
  'Transparency',
  'Decentralization',
  'Financial Inclusion',
  'Efficiency',
  'Automation',
  'Team Collaboration',
  'Sustainability',
  'Social Impact',
  'Quality',
  'Speed',
  'Reliability',
  'Security',
  'Privacy',
  'Accessibility',
  'Diversity',
  'Growth',
  'Profitability',
];

// Common key assets suggestions
export const KEY_ASSETS_SUGGESTIONS = [
  'Proprietary technology',
  'Patents',
  'User base',
  'Brand recognition',
  'Team expertise',
  'Partnerships',
  'Data assets',
  'Distribution channels',
  'Regulatory approvals',
  'Product-market fit',
  'Revenue streams',
  'Customer relationships',
  'Intellectual property',
  'Manufacturing capabilities',
  'Supply chain',
  'Market position',
  'Technical infrastructure',
  'Research & development',
  'Marketing channels',
  'Sales team',
];

// Common gaps/needs suggestions
export const GAPS_NEEDS_SUGGESTIONS = [
  'Technical expertise',
  'Marketing capabilities',
  'Sales channels',
  'Funding',
  'Talent acquisition',
  'Market access',
  'Regulatory knowledge',
  'International expansion',
  'Product development',
  'Customer acquisition',
  'Brand building',
  'Operations scaling',
  'Supply chain',
  'Distribution network',
  'Strategic partnerships',
  'Industry connections',
  'Data analytics',
  'AI/ML capabilities',
  'Security expertise',
  'Compliance support',
];

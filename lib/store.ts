import { create } from 'zustand';
import { User, Founder, Agreement, AuthSession, Theme } from './types';
import { getCurrentSession, getCurrentUser } from './auth';
import { founderStorage, agreementStorage, themeStorage } from './storage';

interface AppState {
  // Auth state
  session: AuthSession | null;
  user: User | null;
  currentFounder: Founder | null;
  
  // Theme
  theme: Theme;
  
  // Data cache
  founders: Founder[];
  agreements: Agreement[];
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  initializeApp: () => void;
  setSession: (session: AuthSession | null, user: User | null) => void;
  setCurrentFounder: (founder: Founder | null) => void;
  setTheme: (theme: Theme) => void;
  refreshData: () => void;
  addFounder: (founder: Founder) => void;
  updateFounder: (founder: Founder) => void;
  addAgreement: (agreement: Agreement) => void;
  updateAgreement: (agreement: Agreement) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  session: null,
  user: null,
  currentFounder: null,
  theme: 'light',
  founders: [],
  agreements: [],
  isLoading: true,
  
  // Initialize app - load session, theme, and data
  initializeApp: () => {
    const session = getCurrentSession();
    const user = getCurrentUser();
    const theme = themeStorage.get();
    const founders = founderStorage.getAll();
    const agreements = agreementStorage.getAll();
    
    let currentFounder: Founder | null = null;
    if (session?.founderId) {
      currentFounder = founderStorage.findById(session.founderId);
    } else if (user) {
      // Auto-select founder if user has one
      currentFounder = founderStorage.findByUserId(user.id);
      if (currentFounder && session) {
        session.founderId = currentFounder.id;
      }
    }
    
    set({
      session,
      user,
      currentFounder,
      theme,
      founders,
      agreements,
      isLoading: false,
    });
    
    // Apply theme to document
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },
  
  // Set authentication session
  setSession: (session, user) => {
    let currentFounder: Founder | null = null;
    if (session?.founderId) {
      currentFounder = founderStorage.findById(session.founderId);
    } else if (user) {
      currentFounder = founderStorage.findByUserId(user.id);
    }
    
    set({ session, user, currentFounder });
  },
  
  // Set current founder
  setCurrentFounder: (founder) => {
    const { session } = get();
    if (session && founder) {
      session.founderId = founder.id;
    }
    set({ currentFounder: founder });
  },
  
  // Set theme
  setTheme: (theme) => {
    themeStorage.save(theme);
    set({ theme });
    
    // Apply theme to document
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },
  
  // Refresh data from storage
  refreshData: () => {
    const founders = founderStorage.getAll();
    const agreements = agreementStorage.getAll();
    set({ founders, agreements });
  },
  
  // Add founder
  addFounder: (founder) => {
    founderStorage.save(founder);
    const founders = [...get().founders, founder];
    set({ founders });
  },
  
  // Update founder
  updateFounder: (founder) => {
    founderStorage.save(founder);
    const founders = get().founders.map(f => f.id === founder.id ? founder : f);
    set({ founders });
  },
  
  // Add agreement
  addAgreement: (agreement) => {
    agreementStorage.save(agreement);
    const agreements = [...get().agreements, agreement];
    set({ agreements });
  },
  
  // Update agreement
  updateAgreement: (agreement) => {
    agreementStorage.save(agreement);
    const agreements = get().agreements.map(a => a.id === agreement.id ? agreement : a);
    set({ agreements });
  },
}));

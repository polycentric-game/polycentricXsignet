import { create } from 'zustand';
import { User, Founder, Agreement, AuthSession, Theme } from './types';
import { getCurrentSession, getCurrentUser } from './auth';
import { founderStorage, agreementStorage, sessionStorage, themeStorage } from './storage';
import { initializeSampleData } from './sampleData';

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
  clearSession: () => void;
  setCurrentFounder: (founder: Founder | null) => Promise<void>;
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
  initializeApp: async () => {
    try {
      const session = getCurrentSession();
      const user = session ? await getCurrentUser() : null;
      const theme = themeStorage.get();
      
      // Try to load data, but handle missing tables gracefully
      let founders: Founder[] = [];
      let agreements: Agreement[] = [];
      
      try {
        founders = await founderStorage.getAll();
        agreements = await agreementStorage.getAll();
        
        // Initialize sample data if needed
        await initializeSampleData();
      } catch (dbError: any) {
        // Check if it's a table missing error
        if (dbError?.code === 'PGRST205' || dbError?.message?.includes('Could not find the table')) {
          console.warn('Database tables not found. Please run the migration:', dbError.message);
          // Continue with empty arrays - app will still work, just no data
        } else {
          throw dbError; // Re-throw if it's a different error
        }
      }
      
      let currentFounder: Founder | null = null;
      if (session?.founderId) {
        try {
          currentFounder = await founderStorage.findById(session.founderId);
        } catch (error) {
          // Table might not exist, that's okay
          console.warn('Could not load founder:', error);
        }
      } else if (user) {
        try {
          // Auto-select founder if user has one
          currentFounder = await founderStorage.findByUserId(user.id);
          if (currentFounder && session) {
            session.founderId = currentFounder.id;
            // Update session in storage
            await sessionStorage.save(session);
          }
        } catch (error) {
          // Table might not exist, that's okay
          console.warn('Could not load founder by user:', error);
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
    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({ isLoading: false });
    }
  },
  
  // Set authentication session
  setSession: async (session, user) => {
    try {
      let currentFounder: Founder | null = null;
      if (session?.founderId) {
        currentFounder = await founderStorage.findById(session.founderId);
      } else if (user) {
        currentFounder = await founderStorage.findByUserId(user.id);
        if (currentFounder && session) {
          // Update session with founder ID
          session.founderId = currentFounder.id;
          await sessionStorage.save(session);
        }
      }
      
      set({ session, user, currentFounder });
    } catch (error) {
      console.error('Failed to set session:', error);
      set({ session, user, currentFounder: null });
    }
  },
  
  // Clear authentication session
  clearSession: () => {
    set({ session: null, user: null, currentFounder: null });
  },
  
  // Set current founder
  setCurrentFounder: async (founder) => {
    const { session } = get();
    if (session && founder) {
      session.founderId = founder.id;
      // Update session in storage
      await sessionStorage.save(session);
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
  refreshData: async () => {
    try {
      const founders = await founderStorage.getAll();
      const agreements = await agreementStorage.getAll();
      set({ founders, agreements });
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  },
  
  // Add founder
  addFounder: async (founder) => {
    try {
      const savedFounder = await founderStorage.save(founder);
      const founders = [...get().founders, savedFounder];
      set({ founders });
    } catch (error) {
      console.error('Failed to add founder:', error);
    }
  },
  
  // Update founder
  updateFounder: async (founder) => {
    try {
      const updatedFounder = await founderStorage.save(founder);
      const founders = get().founders.map(f => f.id === founder.id ? updatedFounder : f);
      set({ founders });
    } catch (error) {
      console.error('Failed to update founder:', error);
    }
  },
  
  // Add agreement
  addAgreement: async (agreement) => {
    try {
      const savedAgreement = await agreementStorage.save(agreement);
      const agreements = [...get().agreements, savedAgreement];
      set({ agreements });
    } catch (error) {
      console.error('Failed to add agreement:', error);
    }
  },
  
  // Update agreement
  updateAgreement: async (agreement) => {
    try {
      const updatedAgreement = await agreementStorage.save(agreement);
      const agreements = get().agreements.map(a => a.id === agreement.id ? updatedAgreement : a);
      set({ agreements });
    } catch (error) {
      console.error('Failed to update agreement:', error);
    }
  },
}));

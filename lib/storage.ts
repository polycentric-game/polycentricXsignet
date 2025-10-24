import { User, Founder, Agreement, AuthSession, Theme } from './types';

const STORAGE_KEYS = {
  USERS: 'polycentric_users',
  FOUNDERS: 'polycentric_founders',
  AGREEMENTS: 'polycentric_agreements',
  SESSION: 'polycentric_session',
  THEME: 'polycentric_theme',
} as const;

// Generic storage helpers
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

function getItemFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveItemToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// User storage
export const userStorage = {
  getAll: (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS),
  
  save: (user: User): void => {
    const users = userStorage.getAll();
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    saveToStorage(STORAGE_KEYS.USERS, users);
  },
  
  findById: (id: string): User | null => {
    const users = userStorage.getAll();
    return users.find(u => u.id === id) || null;
  },
  
  findByEmail: (email: string): User | null => {
    const users = userStorage.getAll();
    return users.find(u => u.email === email) || null;
  },
  
  findByEthereumAddress: (address: string): User | null => {
    const users = userStorage.getAll();
    return users.find(u => u.ethereumAddress === address) || null;
  },
};

// Founder storage
export const founderStorage = {
  getAll: (): Founder[] => getFromStorage<Founder>(STORAGE_KEYS.FOUNDERS),
  
  save: (founder: Founder): void => {
    const founders = founderStorage.getAll();
    const existingIndex = founders.findIndex(f => f.id === founder.id);
    if (existingIndex >= 0) {
      founders[existingIndex] = founder;
    } else {
      founders.push(founder);
    }
    saveToStorage(STORAGE_KEYS.FOUNDERS, founders);
  },
  
  findById: (id: string): Founder | null => {
    const founders = founderStorage.getAll();
    return founders.find(f => f.id === id) || null;
  },
  
  findByUserId: (userId: string): Founder | null => {
    const founders = founderStorage.getAll();
    return founders.find(f => f.userId === userId) || null;
  },
  
  delete: (id: string): void => {
    const founders = founderStorage.getAll();
    const filtered = founders.filter(f => f.id !== id);
    saveToStorage(STORAGE_KEYS.FOUNDERS, filtered);
  },
};

// Agreement storage
export const agreementStorage = {
  getAll: (): Agreement[] => getFromStorage<Agreement>(STORAGE_KEYS.AGREEMENTS),
  
  save: (agreement: Agreement): void => {
    const agreements = agreementStorage.getAll();
    const existingIndex = agreements.findIndex(a => a.id === agreement.id);
    if (existingIndex >= 0) {
      agreements[existingIndex] = agreement;
    } else {
      agreements.push(agreement);
    }
    saveToStorage(STORAGE_KEYS.AGREEMENTS, agreements);
  },
  
  findById: (id: string): Agreement | null => {
    const agreements = agreementStorage.getAll();
    return agreements.find(a => a.id === id) || null;
  },
  
  findByFounderId: (founderId: string): Agreement[] => {
    const agreements = agreementStorage.getAll();
    return agreements.filter(a => a.founderAId === founderId || a.founderBId === founderId);
  },
  
  delete: (id: string): void => {
    const agreements = agreementStorage.getAll();
    const filtered = agreements.filter(a => a.id !== id);
    saveToStorage(STORAGE_KEYS.AGREEMENTS, filtered);
  },
};

// Session storage
export const sessionStorage = {
  get: (): AuthSession | null => getItemFromStorage<AuthSession>(STORAGE_KEYS.SESSION),
  
  save: (session: AuthSession): void => {
    saveItemToStorage(STORAGE_KEYS.SESSION, session);
  },
  
  clear: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  },
  
  isValid: (): boolean => {
    const session = sessionStorage.get();
    if (!session) return false;
    return new Date(session.expiresAt) > new Date();
  },
};

// Theme storage
export const themeStorage = {
  get: (): Theme => {
    const theme = getItemFromStorage<Theme>(STORAGE_KEYS.THEME);
    return theme || 'light';
  },
  
  save: (theme: Theme): void => {
    saveItemToStorage(STORAGE_KEYS.THEME, theme);
  },
};

// Generate unique IDs
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return prefix ? `${prefix}${timestamp}${random}` : `${timestamp}${random}`;
}

// Generate agreement ID (A1, A2, etc.)
export function generateAgreementId(): string {
  const agreements = agreementStorage.getAll();
  const maxId = agreements.reduce((max, agreement) => {
    const num = parseInt(agreement.id.substring(1));
    return num > max ? num : max;
  }, 0);
  return `A${maxId + 1}`;
}

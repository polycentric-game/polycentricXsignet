import { User, AuthSession } from './types';
import { userStorage, sessionStorage, generateId } from './storage';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

// Create session with 7-day expiry
function createSession(userId: string, founderId?: string): AuthSession {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  return {
    userId,
    founderId,
    expiresAt: expiresAt.toISOString(),
  };
}

// Ethereum authentication using wallet address
export async function signInWithWallet(address: string): Promise<AuthResult> {
  if (!address) {
    return { success: false, error: 'Wallet address is required' };
  }
  
  // Check if user exists with this address
  let user = userStorage.findByEthereumAddress(address);
  
  if (!user) {
    // Create new user
    user = {
      id: generateId('user_'),
      ethereumAddress: address,
      createdAt: new Date().toISOString(),
    };
    userStorage.save(user);
  }
  
  // Create session
  const session = createSession(user.id);
  sessionStorage.save(session);
  
  return { success: true, user, session };
}

// Get current session
export function getCurrentSession(): AuthSession | null {
  if (!sessionStorage.isValid()) {
    sessionStorage.clear();
    return null;
  }
  return sessionStorage.get();
}

// Get current user
export function getCurrentUser(): User | null {
  const session = getCurrentSession();
  if (!session) return null;
  
  return userStorage.findById(session.userId);
}

// Sign out
export function signOut(): void {
  sessionStorage.clear();
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return sessionStorage.isValid();
}

// Update session with founder ID
export function setCurrentFounder(founderId: string): void {
  const session = getCurrentSession();
  if (session) {
    session.founderId = founderId;
    sessionStorage.save(session);
  }
}

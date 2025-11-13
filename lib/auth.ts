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
  
  try {
    // Check if user exists with this address
    let user = await userStorage.findByEthereumAddress(address);
    
    if (!user) {
      // Create new user
      user = {
        id: generateId('user_'),
        ethereumAddress: address,
        createdAt: new Date().toISOString(),
      };
      user = await userStorage.save(user);
    }
    
    // Create session
    const session = createSession(user.id);
    await sessionStorage.save(session);
    
    return { success: true, user, session };
  } catch (error: any) {
    // Check if it's a table missing error
    if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
      console.error('Database tables not found. Please run the migration:', error.message);
      return { success: false, error: 'Database not set up. Please run the migration to create tables.' };
    }
    console.error('Sign in error:', error);
    return { success: false, error: 'Failed to sign in with wallet' };
  }
}

// Get current session
export function getCurrentSession(): AuthSession | null {
  const session = sessionStorage.get();
  if (!session) return null;
  
  // Check expiry synchronously using the session data
  const expiresAt = new Date(session.expiresAt);
  if (expiresAt <= new Date()) {
    // Don't await here to keep this function synchronous
    sessionStorage.clear();
    return null;
  }
  
  return session;
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const session = getCurrentSession();
  if (!session) return null;
  
  try {
    return await userStorage.findById(session.userId);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Sign out
export async function signOut(): Promise<void> {
  await sessionStorage.clear();
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  return await sessionStorage.isValid();
}

// Update session with founder ID
export async function setCurrentFounder(founderId: string): Promise<void> {
  const session = getCurrentSession();
  if (session) {
    session.founderId = founderId;
    await sessionStorage.save(session);
  }
}

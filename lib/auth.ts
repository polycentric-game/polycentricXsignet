import { User, AuthSession } from './types';
import { userStorage, sessionStorage, generateId } from './storage';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  confirmPassword: string;
}

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

// Email/password authentication (simulated)
export async function signInWithEmail(credentials: SignInCredentials): Promise<AuthResult> {
  const { email, password } = credentials;
  
  // Basic validation
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }
  
  // Find existing user
  const existingUser = userStorage.findByEmail(email);
  if (!existingUser) {
    return { success: false, error: 'User not found' };
  }
  
  // In a real app, we'd verify the password hash
  // For demo purposes, we'll just check if password is not empty
  if (password.length < 1) {
    return { success: false, error: 'Invalid password' };
  }
  
  // Create session
  const session = createSession(existingUser.id);
  sessionStorage.save(session);
  
  return { success: true, user: existingUser, session };
}

export async function signUpWithEmail(credentials: SignUpCredentials): Promise<AuthResult> {
  const { email, password, confirmPassword } = credentials;
  
  // Basic validation
  if (!email || !password || !confirmPassword) {
    return { success: false, error: 'All fields are required' };
  }
  
  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match' };
  }
  
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }
  
  // Check if user already exists
  const existingUser = userStorage.findByEmail(email);
  if (existingUser) {
    return { success: false, error: 'User already exists with this email' };
  }
  
  // Create new user
  const user: User = {
    id: generateId('user_'),
    email,
    createdAt: new Date().toISOString(),
  };
  
  userStorage.save(user);
  
  // Create session
  const session = createSession(user.id);
  sessionStorage.save(session);
  
  return { success: true, user, session };
}

// Ethereum authentication (simulated)
export async function signInWithEthereum(): Promise<AuthResult> {
  // Simulate Ethereum wallet connection
  // In a real app, this would use Web3 or similar
  const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
  
  // Check if user exists with this address
  let user = userStorage.findByEthereumAddress(mockAddress);
  
  if (!user) {
    // Create new user
    user = {
      id: generateId('user_'),
      ethereumAddress: mockAddress,
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

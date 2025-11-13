import { User, Founder, Agreement, AuthSession, Theme } from './types';
import { supabase } from './supabase';

// Supabase-backed storage classes
class UserStorage {
  async save(user: User): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || null,
        ethereum_address: user.ethereumAddress || null,
        created_at: user.createdAt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      email: data.email || undefined,
      ethereumAddress: data.ethereum_address || undefined,
      createdAt: data.created_at,
    };
  }
  
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email || undefined,
      ethereumAddress: data.ethereum_address || undefined,
      createdAt: data.created_at,
    };
  }
  
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email || undefined,
      ethereumAddress: data.ethereum_address || undefined,
      createdAt: data.created_at,
    };
  }
  
  async findByEthereumAddress(address: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('ethereum_address', address)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email || undefined,
      ethereumAddress: data.ethereum_address || undefined,
      createdAt: data.created_at,
    };
  }
  
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    
    return data.map(row => ({
      id: row.id,
      email: row.email || undefined,
      ethereumAddress: row.ethereum_address || undefined,
      createdAt: row.created_at,
    }));
  }
}

class FounderStorage {
  async save(founder: Founder): Promise<Founder> {
    const { data, error } = await supabase
      .from('founders')
      .upsert({
        id: founder.id,
        user_id: founder.userId,
        founder_name: founder.founderName,
        founder_type: founder.founderType,
        founder_values: founder.founderValues,
        company_name: founder.companyName,
        company_description: founder.companyDescription,
        stage: founder.stage,
        current_valuation_range: founder.currentValuationRange,
        business_model: founder.businessModel,
        key_assets: founder.keyAssets,
        swap_motivation: founder.swapMotivation,
        gaps_or_needs: founder.gapsOrNeeds,
        total_equity_available: founder.totalEquityAvailable,
        equity_swapped: founder.equitySwapped,
        created_at: founder.createdAt,
        updated_at: founder.updatedAt,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return this.mapRowToFounder(data);
  }
  
  async findById(id: string): Promise<Founder | null> {
    const { data, error } = await supabase
      .from('founders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return this.mapRowToFounder(data);
  }
  
  async findByUserId(userId: string): Promise<Founder | null> {
    const { data, error } = await supabase
      .from('founders')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return null;
    
    return this.mapRowToFounder(data);
  }
  
  async getAll(): Promise<Founder[]> {
    const { data, error } = await supabase
      .from('founders')
      .select('*');
    
    if (error) throw error;
    
    return data.map(row => this.mapRowToFounder(row));
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('founders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  private mapRowToFounder(row: any): Founder {
    return {
      id: row.id,
      userId: row.user_id,
      founderName: row.founder_name,
      founderType: row.founder_type,
      founderValues: row.founder_values as [string, string, string],
      companyName: row.company_name,
      companyDescription: row.company_description,
      stage: row.stage,
      currentValuationRange: row.current_valuation_range,
      businessModel: row.business_model,
      keyAssets: row.key_assets,
      swapMotivation: row.swap_motivation,
      gapsOrNeeds: row.gaps_or_needs,
      totalEquityAvailable: row.total_equity_available,
      equitySwapped: row.equity_swapped,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

class AgreementStorage {
  async save(agreement: Agreement): Promise<Agreement> {
    const { data, error } = await supabase
      .from('agreements')
      .upsert({
        id: agreement.id,
        founder_a_id: agreement.founderAId,
        founder_b_id: agreement.founderBId,
        status: agreement.status,
        initiated_by: agreement.initiatedBy,
        last_revised_by: agreement.lastRevisedBy,
        current_version: agreement.currentVersion,
        versions: agreement.versions,
        created_at: agreement.createdAt,
        updated_at: agreement.updatedAt,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return this.mapRowToAgreement(data);
  }
  
  async findById(id: string): Promise<Agreement | null> {
    const { data, error } = await supabase
      .from('agreements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return this.mapRowToAgreement(data);
  }
  
  async getAll(): Promise<Agreement[]> {
    const { data, error } = await supabase
      .from('agreements')
      .select('*');
    
    if (error) throw error;
    
    return data.map(row => this.mapRowToAgreement(row));
  }
  
  async findByFounderId(founderId: string): Promise<Agreement[]> {
    const { data, error } = await supabase
      .from('agreements')
      .select('*')
      .or(`founder_a_id.eq.${founderId},founder_b_id.eq.${founderId}`);
    
    if (error) throw error;
    
    return data.map(row => this.mapRowToAgreement(row));
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agreements')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  private mapRowToAgreement(row: any): Agreement {
    return {
      id: row.id,
      founderAId: row.founder_a_id,
      founderBId: row.founder_b_id,
      status: row.status,
      initiatedBy: row.initiated_by,
      lastRevisedBy: row.last_revised_by,
      currentVersion: row.current_version,
      versions: row.versions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

class SessionStorage {
  async save(session: AuthSession): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .upsert({
        id: this.generateSessionId(),
        user_id: session.userId,
        founder_id: session.founderId || null,
        expires_at: session.expiresAt,
        created_at: new Date().toISOString(),
      });
    
    if (error) throw error;
    
    // Also save to localStorage for quick access
    if (typeof window !== 'undefined') {
      localStorage.setItem('polycentric_session', JSON.stringify(session));
    }
  }
  
  get(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('polycentric_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  
  async isValid(): Promise<boolean> {
    const session = this.get();
    if (!session) return false;
    
    const expiresAt = new Date(session.expiresAt);
    if (expiresAt <= new Date()) {
      await this.clear();
      return false;
    }
    
    return true;
  }
  
  async clear(): Promise<void> {
    const session = this.get();
    if (session) {
      // Remove from database
      await supabase
        .from('sessions')
        .delete()
        .eq('user_id', session.userId);
    }
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('polycentric_session');
    }
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class ThemeStorage {
  private key = 'polycentric_theme';
  
  save(theme: Theme) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.key, theme);
  }
  
  get(): Theme {
    if (typeof window === 'undefined') return 'light';
    
    try {
      const stored = localStorage.getItem(this.key);
      return (stored as Theme) || 'light';
    } catch {
      return 'light';
    }
  }
}

// Generate unique IDs
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}_${random}`;
}

// Generate agreement ID (A1, A2, etc.)
export async function generateAgreementId(): Promise<string> {
  const agreements = await agreementStorage.getAll();
  const maxId = agreements.reduce((max, agreement) => {
    const num = parseInt(agreement.id.substring(1));
    return num > max ? num : max;
  }, 0);
  return `A${maxId + 1}`;
}

// Export storage instances
export const userStorage = new UserStorage();
export const founderStorage = new FounderStorage();
export const agreementStorage = new AgreementStorage();
export const sessionStorage = new SessionStorage();
export const themeStorage = new ThemeStorage();

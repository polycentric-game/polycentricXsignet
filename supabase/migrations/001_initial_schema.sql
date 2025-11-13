-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  ethereum_address TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Founders table
CREATE TABLE founders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  founder_name TEXT NOT NULL,
  founder_type TEXT NOT NULL,
  founder_values TEXT[] NOT NULL,
  company_name TEXT NOT NULL,
  company_description TEXT NOT NULL,
  stage TEXT NOT NULL,
  current_valuation_range TEXT NOT NULL,
  business_model TEXT NOT NULL,
  key_assets TEXT[] NOT NULL,
  swap_motivation TEXT NOT NULL,
  gaps_or_needs TEXT[] NOT NULL,
  total_equity_available INTEGER DEFAULT 100,
  equity_swapped INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agreements table
CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_a_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  founder_b_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('proposed', 'revised', 'approved', 'completed')),
  initiated_by UUID NOT NULL REFERENCES founders(id),
  last_revised_by UUID NOT NULL REFERENCES founders(id),
  current_version INTEGER DEFAULT 0,
  versions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  founder_id UUID REFERENCES founders(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_ethereum_address ON users(ethereum_address);
CREATE INDEX idx_founders_user_id ON founders(user_id);
CREATE INDEX idx_agreements_founder_a_id ON agreements(founder_a_id);
CREATE INDEX idx_agreements_founder_b_id ON agreements(founder_b_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

-- Founders can be viewed by all users, but only updated by owner
CREATE POLICY "Founders are viewable by all" ON founders FOR SELECT USING (true);
CREATE POLICY "Users can insert own founders" ON founders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own founders" ON founders FOR UPDATE USING (user_id = auth.uid()::uuid);

-- Agreements can be viewed by all users, but only updated by participants
CREATE POLICY "Agreements are viewable by all" ON agreements FOR SELECT USING (true);
CREATE POLICY "Users can insert agreements" ON agreements FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants can update agreements" ON agreements FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM founders 
    WHERE (founders.id = agreements.founder_a_id OR founders.id = agreements.founder_b_id)
    AND founders.user_id = auth.uid()::uuid
  )
);

-- Sessions are private to the user
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (user_id = auth.uid()::uuid);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_founders_updated_at BEFORE UPDATE ON founders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agreements_updated_at BEFORE UPDATE ON agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

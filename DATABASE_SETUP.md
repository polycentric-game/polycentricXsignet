# Database Setup Instructions

## Supabase Database Migration

The application requires database tables to be created. The migration file is located at:
`supabase/migrations/001_initial_schema.sql`

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option 3: Manual SQL Execution

1. Connect to your Supabase database using any PostgreSQL client
2. Execute the SQL from `supabase/migrations/001_initial_schema.sql`

## Required Tables

The migration creates the following tables:
- `users` - User accounts linked to Ethereum addresses
- `founders` - Founder profiles
- `agreements` - Equity swap agreements
- `sessions` - User sessions

## After Running Migration

Once the migration is complete, restart your Next.js development server:

```bash
npm run dev
```

The application should now work without database errors.


import { createClient } from '@supabase/supabase-js'

// Admin client with service role key for server-side operations
export const supabaseAdmin = createClient(
  'https://spjkugnxvomrsaapfbgx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamt1Z254dm9tcnNhYXBmYmd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk5NDU5OCwiZXhwIjoyMDc5NTcwNTk4fQ.UV9gri0-kMASO_091J3womAJIp75r1zvWBWA49Hy6OE'
)

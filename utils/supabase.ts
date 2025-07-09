import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eazgirgjeerixqmpxpog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhemdpcmdqZWVyaXhxbXB4cG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NzkwMTEsImV4cCI6MjA2NzQ1NTAxMX0.oq6svspm974DRLdRmc1MzztG2RUCx5rOGtzLQUDmkHk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
const SUPABASE_URL = 'https://glvobavkczzzruqfqwfl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsdm9iYXZrY3p6enJ1cWZxd2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4Mjg3MTcsImV4cCI6MjEwNjQwNDcxN30.VjPS8TY_cWMdy_ntvOTHV1V8bmE86-QvCfQ69OVoMJA';

// Instância global do Supabase provida pelo CDN
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
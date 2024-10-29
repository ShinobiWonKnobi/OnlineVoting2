import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = 'https://nyimgdswhgxjnmisjfkl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aW1nZHN3aGd4am5taXNqZmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyMTg0NTksImV4cCI6MjA0NTc5NDQ1OX0.XDscyGjj-IgpsPHIvliqSwl9JbDlsmbmEOFtMKq7mmE';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
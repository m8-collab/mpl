/* =====================================================================
   SUPABASE CONNECTION
   Fill these two values in after creating your free Supabase project:
   Dashboard → Project Settings → API → "Project URL" and "anon public" key.
   The anon key is SAFE to publish in this file — it's a public key, and
   the database is locked down separately with Row Level Security (see
   supabase/schema.sql). Never put a "service_role" key in this file.
===================================================================== */
const SUPABASE_URL = 'https://mtrffikgpwsigugjbnbx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10cmZmaWtncHdzaWd1Z2pibmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDAwMjAsImV4cCI6MjEwMTUxNjAyMH0.K4spOB0EkFu0Xyj3Fh1840CW7LMjCLOTBBURuUfE-h0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

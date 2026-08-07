/* =====================================================================
   SUPABASE CONNECTION
   Already filled in with your real project credentials.

   IMPORTANT: we call our client "db", not "supabase" — the Supabase
   CDN library itself already registers a global called "supabase" the
   moment it loads. Declaring our own "const supabase = ..." on top of
   that collides with the library's own global and throws
   "Identifier 'supabase' has already been declared" in some browsers,
   no matter how clean the file is. Using "db" avoids the collision
   entirely.

   The anon key is SAFE to publish — it's a public key, and the database
   is locked down separately with Row Level Security (see supabase/schema.sql).
   Never put a "service_role" key in this file.
===================================================================== */
const SUPABASE_URL = 'https://mtrffikgpwsigugjbnbx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10cmZmaWtncHdzaWd1Z2pibmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDAwMjAsImV4cCI6MjEwMTUxNjAyMH0.K4spOB0EkFu0Xyj3Fh1840CW7LMjCLOTBBURuUfE-h0';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

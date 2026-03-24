import { createClient } from "@supabase/supabase-js";

// External Supabase project used for access control (profiles, products, entitlements)
const EXTERNAL_SUPABASE_URL = "https://vygtkmmkfrfrclfnljop.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5Z3RrbW1rZnJmcmNsZm5sam9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzA1OTUsImV4cCI6MjA4OTg0NjU5NX0.hPI6Yppz-CybKsXTEfUElxxmojyPKJ4ujy6msK9zLBE";

export const externalSupabase = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_ANON_KEY
);

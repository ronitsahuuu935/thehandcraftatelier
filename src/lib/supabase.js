import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const productStorageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "product-images";

export const supabase = supabaseUrl && supabasePublishableKey && supabasePublishableKey !== "******"
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

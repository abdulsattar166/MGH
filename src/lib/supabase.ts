import { createClient, type LockFunc } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

// Web-Locks based session lock (falls back to running the callback directly
// where the Web Locks API is unavailable).
const lock: LockFunc = (name, _acquireTimeout, fn) => {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return fn();
  }
  return navigator.locks.request(name, () => fn());
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    lock,
  },
});
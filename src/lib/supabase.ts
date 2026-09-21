import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

function acquireLock(name: string): Promise<() => Promise<void>> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.locks) {
      resolve(async () => {});
      return;
    }
    navigator.locks.request(name, { timeout: 10000 }, (lock) => {
      if (!lock) {
        resolve(async () => {});
        return;
      }
      return new Promise<void>((release) => {
        resolve(async () => release());
      });
    });
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    lock: acquireLock,
  },
});
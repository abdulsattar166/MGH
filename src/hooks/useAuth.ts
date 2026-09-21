import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api, apiMode, getToken, setToken } from "@/lib/api";

export type Role = "admin" | "superintendent" | "warden" | "student";

export type AuthUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
  hostelId: number | null;
  avatarUrl: string | null;
  position: string | null;
  isActive: boolean;
  studentId: number | null;
};

type Profile = {
  id: string;
  role: Role;
  name: string | null;
  email: string | null;
  hostel_id: number | null;
  avatar_url: string | null;
  position: string | null;
  is_active: boolean | null;
  student_id: number | null;
};

const PROFILE_COLS = "id, role, name, email, hostel_id, avatar_url, position, is_active, student_id";

function toAuthUser(profile: Profile, email: string): AuthUser {
  return {
    id: profile.id,
    role: profile.role,
    name: profile.name ?? "User",
    email: profile.email ?? email,
    hostelId: profile.hostel_id,
    avatarUrl: profile.avatar_url,
    position: profile.position,
    isActive: profile.is_active ?? true,
    studentId: profile.student_id,
  };
}

async function fetchProfile(id: string, email: string): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return toAuthUser(data as Profile, email);
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (apiMode) {
      const token = getToken();
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }
      api
        .get<AuthUser>("/auth/me")
        .then((u) => {
          if (mounted) setUser(u);
        })
        .catch(() => {
          setToken(null);
          if (mounted) setUser(null);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session;
      if (session?.user) {
        const uid = session.user.id;
        const email = session.user.email ?? "";
        fetchProfile(uid, email).then((profile) => {
          if (!mounted) return;
          setUser(profile);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const uid = session.user.id;
        const email = session.user.email ?? "";
        window.setTimeout(() => {
          fetchProfile(uid, email).then((profile) => {
            if (!mounted) return;
            setUser(profile);
          });
        }, 0);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (apiMode) {
      try {
        const data = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
          email,
          password,
        });
        setToken(data.token);
        setUser(data.user);
        return null;
      } catch (e) {
        return { message: (e as Error).message };
      }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (apiMode) {
      try {
        const data = await api.post<{ token: string; user: AuthUser }>("/auth/register", {
          name,
          email,
          password,
        });
        setToken(data.token);
        setUser(data.user);
        return { data: { session: { user: data.user }, user: data.user }, error: null };
      } catch (e) {
        return { data: null, error: { message: (e as Error).message } };
      }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { data, error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (apiMode) {
      try {
        await api.post("/auth/reset-password-request", { email });
        return null;
      } catch (e) {
        return { message: (e as Error).message };
      }
    }
    const basePath = __BASE_PATH__.split("/").filter(Boolean).join("/");
    const pathPrefix = basePath ? `/${basePath}` : "";
    const redirectTo = `${window.location.origin}${pathPrefix}/manage/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (apiMode) {
      try {
        await api.post("/auth/update-password", { password });
        return null;
      } catch (e) {
        return { message: (e as Error).message };
      }
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from("profiles").update({ must_change_password: false }).eq("id", data.user.id);
      }
    }
    return error;
  }, []);

  const signOut = useCallback(async () => {
    if (apiMode) {
      setToken(null);
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, signIn, signUp, resetPassword, updatePassword, signOut };
}
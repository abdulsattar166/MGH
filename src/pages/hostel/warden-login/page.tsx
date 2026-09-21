import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { hostels, hostelLocations } from "@/mocks/hostels";
import { useAuth } from "@/hooks/useAuth";
import { useWardens } from "@/hooks/useWardens";
import { api, apiMode } from "@/lib/api";
import type { AuthUser } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export default function WardenLogin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hostel = hostels.find((h) => h.id === Number(id));
  const loc = hostelLocations.find((l) => l.id === Number(id));
  const { forHostel } = useWardens();
  const { signIn, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!hostel || !loc) return null;

  const warden = forHostel(hostel.id);
  const wardenName = warden?.name ?? loc.warden;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const err = await signIn(email.trim(), password);
      if (err) {
        setError(err.message);
        return;
      }

      let me: AuthUser | null = null;
      if (apiMode) {
        try {
          me = await api.get<AuthUser>("/auth/me");
        } catch {
          me = null;
        }
        if (!me) {
          setError("Could not verify your account. Please try again.");
          return;
        }
        if (me.isActive === false) {
          await signOut();
          setError("This account has been deactivated. Please contact the super admin.");
          return;
        }
        const isStaff = ["warden", "admin", "superintendent"].includes(me.role);
        if (!isStaff) {
          await signOut();
          setError("This account does not have management access.");
          return;
        }
        if (me.role === "warden" && me.hostelId !== hostel.id) {
          await signOut();
          setError(
            `This account is not the hostel admin of ${hostel.name}. Hostel admins can only access their own hostel.`
          );
          return;
        }
        navigate("/manage");
        return;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setError("Could not verify your account. Please try again.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, hostel_id, is_active, must_change_password")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!profile) {
        await signOut();
        setError("No profile is linked to this account. Please contact the super admin.");
        return;
      }

      if (profile.is_active === false) {
        await signOut();
        setError("This account has been deactivated. Please contact the super admin.");
        return;
      }

      const role = profile.role as string;
      const isStaff = ["warden", "admin", "superintendent"].includes(role);
      if (!isStaff) {
        await signOut();
        setError("This account does not have management access.");
        return;
      }

      if (role === "warden" && profile.hostel_id !== hostel.id) {
        await signOut();
        setError(
          `This account is not the hostel admin of ${hostel.name}. Hostel admins can only access their own hostel.`
        );
        return;
      }

      if (profile.must_change_password) {
        navigate("/manage/reset-password");
      } else {
        navigate("/manage");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-background-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            to={`/hostel/${id}`}
            className="inline-flex items-center gap-2 text-sm text-foreground-600 hover:text-primary-600 cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            Back to {hostel.name}
          </Link>
          <div className="mt-6 w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-primary-500 flex items-center justify-center">
            {warden?.avatarUrl ? (
              <img src={warden.avatarUrl} alt={wardenName} className="w-full h-full object-cover object-top" />
            ) : (
              <i className="ri-user-settings-line text-background-50 text-3xl"></i>
            )}
          </div>
          <h1 className="mt-5 font-heading text-2xl md:text-3xl font-bold text-foreground-950">
            Hostel Admin Login
          </h1>
          <p className="mt-2 text-sm text-foreground-600">
            {hostel.name} — {wardenName}
          </p>
        </div>

        <div className="bg-background-50 border border-background-200 rounded-2xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="warden-email" className="block text-sm font-medium text-foreground-800 mb-1.5">
                Username / Email
              </label>
              <input
                id="warden-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="warden@example.com"
              />
            </div>
            <div>
              <label htmlFor="warden-password" className="block text-sm font-medium text-foreground-800 mb-1.5">
                Password
              </label>
              <input
                id="warden-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60"
            >
              {submitting && <i className="ri-loader-4-line animate-spin"></i>}
              Sign In
            </button>
            <div className="text-center text-xs text-foreground-500">
              Access is restricted to the assigned hostel admin of {hostel.name}.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
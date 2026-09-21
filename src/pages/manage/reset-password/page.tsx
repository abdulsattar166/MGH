import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { apiMode, getToken } from "@/lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (apiMode) {
      setHasSession(Boolean(getToken()));
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      if (!data.session) {
        setNotice(
          "This reset link is invalid or has expired. Please request a new one from the sign-in page."
        );
      }
      setChecking(false);
    });
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const err = await updatePassword(password);
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setNotice("Password updated! Redirecting to sign in…");
    window.setTimeout(() => navigate("/manage/login"), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="https://static.readdy.ai/image/773d73dcd4bfe3b3ab546a821d990052/7b72bbd942d6c3a71db63e797abcba69.png"
            alt="Mubarak Group of Hostels"
            className="h-14 w-auto"
          />
          <h1 className="mt-5 font-heading text-2xl font-bold text-foreground-950">
            Reset Password
          </h1>
          <p className="mt-1.5 text-sm text-foreground-600">
            Choose a new password for your account
          </p>
        </div>

        <div className="bg-background-50 border border-background-200 rounded-2xl p-6 md:p-8">
          {checking ? (
            <div className="flex items-center justify-center gap-2 py-8 text-foreground-500">
              <i className="ri-loader-4-line animate-spin text-xl"></i>
              <span className="text-sm">Checking your link…</span>
            </div>
          ) : !hasSession ? (
            <div className="text-center py-6">
              <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2 inline-block">
                {notice}
              </div>
              <div className="mt-5">
                <Link
                  to="/manage/login"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
                >
                  ← Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground-800 mb-1.5">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-foreground-800 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              {error && (
                <div className="text-sm text-accent-700 bg-accent-100 rounded-md px-3 py-2">{error}</div>
              )}
              {notice && (
                <div className="text-sm text-primary-800 bg-primary-100 rounded-md px-3 py-2">{notice}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold whitespace-nowrap cursor-pointer transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <i className="ri-loader-4-line animate-spin"></i>}
                Update Password
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-foreground-600 hover:text-primary-600 cursor-pointer">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
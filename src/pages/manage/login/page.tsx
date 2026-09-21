import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup" | "forgot";

export default function ManageLogin() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [setupStatus, setSetupStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [settingUp, setSettingUp] = useState(false);

  const handleSetup = async () => {
    setSettingUp(true);
    setSetupStatus(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("bootstrap-wardens", { body: {} });
      if (invokeErr || data?.error) {
        setSetupStatus({ type: "error", text: invokeErr?.message || data?.error || "Could not initialize accounts." });
      } else {
        setSetupStatus({
          type: "success",
          text: "System accounts are ready. The super admin, superintendent and 6 hostel admins can now sign in.",
        });
      }
    } catch {
      setSetupStatus({ type: "error", text: "Could not initialize accounts. Please try again." });
    } finally {
      setSettingUp(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setNotice("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (mode !== "forgot" && !password.trim()) {
      setError("Please enter your password.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        const err = await signIn(email.trim(), password);
        if (err) {
          setError(err.message);
          return;
        }
        navigate("/manage");
      } else if (mode === "signup") {
        const { data, error: signUpErr } = await signUp(name.trim(), email.trim(), password);
        if (signUpErr) {
          setError(signUpErr.message);
          return;
        }
        if (data?.session) {
          navigate("/manage");
        } else {
          setNotice(
            "Account created! Please check your email to confirm your address, then sign in below."
          );
          setMode("signin");
          setPassword("");
        }
      } else {
        const err = await resetPassword(email.trim());
        if (err) {
          setError(err.message);
          return;
        }
        setNotice(
          "If an account exists for this email, a password reset link has been sent. Please check your inbox."
        );
        setPassword("");
      }
    } finally {
      setSubmitting(false);
    }
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
            {mode === "forgot" ? "Forgot Password" : "Management Portal"}
          </h1>
          <p className="mt-1.5 text-sm text-foreground-600">
            {mode === "forgot"
              ? "Enter your email and we'll send a reset link"
              : "Sign in to manage hostels, students and operations"}
          </p>
        </div>

        <div className="bg-background-50 border border-background-200 rounded-2xl p-6 md:p-8">
          {mode !== "forgot" && (
            <div className="flex bg-background-100 rounded-full p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  mode === "signin"
                    ? "bg-primary-500 text-background-50"
                    : "text-foreground-600 hover:text-foreground-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  mode === "signup"
                    ? "bg-primary-500 text-background-50"
                    : "text-foreground-600 hover:text-foreground-900"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground-800 mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mubarak Owner"
                  className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground-800 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mubarakhostels.pk"
                className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground-800 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-md border border-background-300 bg-background-50 text-foreground-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            )}

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
              {mode === "signin"
                ? "Sign In"
                : mode === "signup"
                  ? "Create Account"
                  : "Send Reset Link"}
            </button>
          </form>

          {mode === "signin" && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-sm text-foreground-600 hover:text-primary-600 font-medium cursor-pointer"
              >
                ← Back to sign in
              </button>
            </div>
          )}

          {mode === "signup" && (
            <p className="mt-4 text-center text-xs text-foreground-500">
              Hostel admin, superintendent and super admin accounts are created by the super admin.
              New sign-ups get student access and can raise complaints from the student portal.
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-foreground-600 hover:text-primary-600 cursor-pointer">
            ← Back to website
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-background-200 text-center">
          <p className="text-xs text-foreground-500 mb-2">First-time setup</p>
          <button
            type="button"
            onClick={handleSetup}
            disabled={settingUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-foreground-600 hover:bg-background-100 whitespace-nowrap cursor-pointer transition disabled:opacity-60"
          >
            {settingUp && <i className="ri-loader-4-line animate-spin"></i>}
            Initialize system accounts
          </button>
          {setupStatus && (
            <div
              className={`mt-3 text-xs rounded-md px-3 py-2 text-left ${
                setupStatus.type === "success" ? "bg-primary-100 text-primary-800" : "bg-accent-100 text-accent-700"
              }`}
            >
              {setupStatus.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
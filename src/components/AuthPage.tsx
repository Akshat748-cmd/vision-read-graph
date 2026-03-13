import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Mail, Lock, User, Loader2, AtSign } from "lucide-react";
import { toast } from "sonner";
import { ForgotPassword } from "./ForgotPassword";

type View = "signin" | "signup" | "forgot";

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [view, setView] = useState<View>("signin");

  // Sign in state
  const [identifier, setIdentifier] = useState("");

  // Sign up state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Shared
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const switchView = (v: View) => {
    setIdentifier("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setView(v);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setLoading(true);
    const { error } = await signIn(identifier.trim().toLowerCase(), password);
    setLoading(false);
    if (error) toast.error(error.message);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await signUp(
      username.trim().toLowerCase(),
      password,
      email.trim() || undefined
    );
    setLoading(false);
    if (error) toast.error(error.message);
  };

  if (view === "forgot") {
    return <ForgotPassword onBack={() => switchView("signin")} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-surface px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-mindmap">
            <Brain className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">MindRead</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {view === "signin" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-elevated border border-border">
          <AnimatePresence mode="wait">
            {view === "signin" ? (
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSignIn}
                className="space-y-3"
              >
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Username or Email"
                    required
                    autoComplete="username"
                    data-testid="input-identifier"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    data-testid="input-password-signin"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchView("forgot")}
                    data-testid="link-forgot-password"
                    className="text-xs text-primary hover:underline font-body"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="button-signin"
                  className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-body font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign In
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSignUp}
                className="space-y-3"
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                    autoComplete="username"
                    data-testid="input-username"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    autoComplete="email"
                    data-testid="input-email"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    data-testid="input-password-signup"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    data-testid="input-confirm-password"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="button-signup"
                  className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-body font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Account
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground mt-4 font-body">
            {view === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => switchView(view === "signin" ? "signup" : "signin")}
              data-testid="link-switch-auth"
              className="text-primary hover:underline font-medium"
            >
              {view === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

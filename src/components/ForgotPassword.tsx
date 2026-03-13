import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Lock, Loader2, ArrowLeft, AtSign, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Step = "identify" | "reset" | "done";

export function ForgotPassword({ onBack }: { onBack: () => void }) {
  const { resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setStep("reset");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(identifier.trim().toLowerCase(), newPassword);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setStep("done");
    }
  };

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
          <h1 className="font-display text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {step === "identify" && "Enter your username or email"}
            {step === "reset" && "Set your new password"}
            {step === "done" && "Password updated!"}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-elevated border border-border">
          <AnimatePresence mode="wait">
            {step === "identify" && (
              <motion.form
                key="identify"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleIdentify}
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
                    data-testid="input-reset-identifier"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  type="submit"
                  data-testid="button-reset-continue"
                  className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-body font-medium text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
                >
                  Continue
                </button>
              </motion.form>
            )}

            {step === "reset" && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleReset}
                className="space-y-3"
              >
                <p className="text-xs text-muted-foreground font-body mb-1">
                  Resetting password for: <span className="font-medium text-foreground">{identifier}</span>
                </p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    data-testid="input-new-password"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    data-testid="input-confirm-new-password"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("identify")}
                    data-testid="button-reset-back"
                    className="h-11 px-4 rounded-xl border border-border font-body text-sm text-muted-foreground hover:bg-muted transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    data-testid="button-reset-submit"
                    className="flex-1 h-11 rounded-xl gradient-primary text-primary-foreground font-body font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Reset Password
                  </button>
                </div>
              </motion.form>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <p className="font-body text-sm text-muted-foreground">
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <button
                  onClick={onBack}
                  data-testid="button-back-to-signin"
                  className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-body font-medium text-sm transition-all hover:opacity-90"
                >
                  Back to Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== "done" && (
            <p className="text-center text-xs text-muted-foreground mt-4 font-body">
              <button
                onClick={onBack}
                data-testid="link-back-to-signin"
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

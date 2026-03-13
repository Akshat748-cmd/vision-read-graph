import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";

interface AuthUser {
  id: string;
  email: string | null;
  username: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (username: string, password: string, email?: string) => Promise<{ error: Error | null }>;
  signIn: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (identifier: string, newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signUp = useCallback(async (username: string, password: string, email?: string) => {
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, email }),
      });
      const data = await r.json();
      if (!r.ok) return { error: new Error(data.error || "Registration failed") };
      setUser(data);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error("Registration failed") };
    }
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });
      const data = await r.json();
      if (!r.ok) return { error: new Error(data.error || "Login failed") };
      setUser(data);
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error("Login failed") };
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (identifier: string, newPassword: string) => {
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, newPassword }),
      });
      const data = await r.json();
      if (!r.ok) return { error: new Error(data.error || "Password reset failed") };
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error("Password reset failed") };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

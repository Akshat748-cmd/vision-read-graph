import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PgSession = connectPg(session);

  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "dev-secret-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Accept either email or username in the "username" field
  passport.use(
    new LocalStrategy(
      { usernameField: "identifier" },
      async (identifier, password, done) => {
        try {
          const user = await storage.getUserByEmailOrUsername(identifier.trim().toLowerCase());
          if (!user) return done(null, false, { message: "Invalid username/email or password" });
          const valid = await comparePasswords(password, user.password);
          if (!valid) return done(null, false, { message: "Invalid username/email or password" });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  // Register: username + password required, email optional
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const normalizedUsername = username.trim().toLowerCase();
      const existingUsername = await storage.getUserByUsername(normalizedUsername);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }
      if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        const existingEmail = await storage.getUserByEmail(normalizedEmail);
        if (existingEmail) {
          return res.status(400).json({ error: "An account with this email already exists" });
        }
      }
      const hashed = await hashPassword(password);
      const user = await storage.createUser(
        normalizedUsername,
        hashed,
        email ? email.trim().toLowerCase() : undefined
      );
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login after register failed" });
        res.json({ id: user.id, email: user.email, username: user.username });
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login: identifier can be email or username
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ error: "Login failed" });
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Session error" });
        res.json({ id: user.id, email: user.email, username: user.username });
      });
    })(req, res, next);
  });

  // Reset password: find by email or username, update password directly
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { identifier, newPassword } = req.body;
      if (!identifier || !newPassword) {
        return res.status(400).json({ error: "Username/email and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const user = await storage.getUserByEmailOrUsername(identifier.trim().toLowerCase());
      if (!user) {
        return res.status(404).json({ error: "No account found with that username or email" });
      }
      const hashed = await hashPassword(newPassword);
      await storage.updatePassword(user.id, hashed);
      res.json({ ok: true });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ error: "Password reset failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => res.json({ ok: true }));
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    const user = req.user as any;
    res.json({ id: user.id, email: user.email, username: user.username });
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
  next();
};

import { db } from "./db";
import { profiles, savedReadings } from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import pg from "pg";

const { Pool } = pg;

export interface User {
  id: string;
  email: string | null;
  username: string | null;
  password: string;
}

const usersPool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureUsersTable() {
  await usersPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  // Add username column if it doesn't exist (migration for existing installs)
  await usersPool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE
  `);
  // Make email nullable if it isn't already
  await usersPool.query(`
    ALTER TABLE users ALTER COLUMN email DROP NOT NULL
  `).catch(() => {});
}

ensureUsersTable().catch(console.error);

export const storage = {
  async getUserByEmail(email: string): Promise<User | null> {
    const { rows } = await usersPool.query("SELECT * FROM users WHERE email = $1", [email]);
    return rows[0] || null;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const { rows } = await usersPool.query("SELECT * FROM users WHERE username = $1", [username]);
    return rows[0] || null;
  },

  async getUserByEmailOrUsername(identifier: string): Promise<User | null> {
    const { rows } = await usersPool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [identifier]
    );
    return rows[0] || null;
  },

  async getUserById(id: string): Promise<User | null> {
    const { rows } = await usersPool.query("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] || null;
  },

  async createUser(username: string, password: string, email?: string): Promise<User> {
    const { rows } = await usersPool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email || null, password]
    );
    return rows[0];
  },

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await usersPool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);
  },

  async getReadingsByUser(userId: string) {
    return db
      .select()
      .from(savedReadings)
      .where(eq(savedReadings.userId, userId))
      .orderBy(desc(savedReadings.createdAt));
  },

  async createReading(data: {
    userId: string;
    title: string;
    query: string;
    summary: string;
    keyConcepts: unknown;
    importantFacts: unknown;
    mindMapData: unknown;
  }) {
    const [reading] = await db.insert(savedReadings).values(data).returning();
    return reading;
  },

  async deleteReading(id: string, userId: string) {
    await db
      .delete(savedReadings)
      .where(eq(savedReadings.id, id));
  },
};

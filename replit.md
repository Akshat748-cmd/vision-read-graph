# MindRead - AI Reading Assistant

## Overview
MindRead is an AI-powered reading assistant that analyzes topics or article text and generates structured summaries, key concepts, important facts, and mind maps.

## Architecture

### Frontend (Vite + React + TypeScript)
- Runs on **port 5000**
- React with React Router, TanStack Query, Tailwind CSS, shadcn/ui components
- Framer Motion for animations
- ReactFlow for mind map visualization

### Backend (Express.js + TypeScript)
- Runs on **port 5001** during development
- Vite proxies `/api/*` requests to the Express server
- Session-based auth with Passport.js (local strategy)
- PostgreSQL via Drizzle ORM

## Key Files

### Server
- `server/index.ts` - Express app entry point
- `server/auth.ts` - Authentication (register, login, logout, session)
- `server/routes.ts` - API routes (readings CRUD + AI analysis)
- `server/storage.ts` - Database access layer
- `server/db.ts` - Drizzle ORM + PostgreSQL pool setup

### Shared
- `shared/schema.ts` - Drizzle schema for `profiles` and `saved_readings` tables

### Frontend
- `src/hooks/useAuth.tsx` - Auth context (fetch-based, session cookies)
- `src/hooks/useReadings.ts` - Readings state management (fetch-based)
- `src/components/AuthPage.tsx` - Login/signup form
- `src/pages/Index.tsx` - Main app page

## Database Schema
- **users** - Email/password auth (created via raw SQL in `server/storage.ts`)
- **profiles** - User profile info
- **saved_readings** - Saved topic analyses with JSON fields for keyConcepts, importantFacts, mindMapData

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (Replit provisioned)
- `SESSION_SECRET` - Session encryption secret (Replit provisioned)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Replit AI Integrations key (auto-injected)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit AI Integrations base URL (auto-injected)

## AI Integration
Uses Replit's managed OpenAI integration (no API key required from user). The `/api/analyze` endpoint calls GPT with function calling to generate structured reading analyses.

## Development
```bash
npm run dev       # Runs both Express server + Vite dev server
npm run db:push   # Sync Drizzle schema to database
npm run build     # Build for production
```

## Migration Notes (from Lovable)
- Replaced Supabase auth with Passport.js + session cookies
- Replaced Supabase Edge Functions with Express route `/api/analyze`
- Replaced Lovable AI gateway with Replit AI Integrations (OpenAI compatible)
- Replaced Supabase database client with Drizzle ORM + Neon Postgres

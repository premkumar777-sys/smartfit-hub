# 💻 Setup & Local Development

Follow this step-by-step guide to run SmartFit AI on your development machine.

## Prerequisites

- **Node.js**: `v18.0.0` or higher
- **Package Manager**: npm (standard)
- **Database/Auth**: Supabase instance (Cloud or Local CLI)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/premkumar777-sys/smartfit-hub.git
   cd smartfit-hub
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install backend dependencies**:
   ```bash
   cd backend
   ```
   ```bash
   npm install
   ```
   ```bash
   cd ..
   ```

## Environment Variables

### 1. Frontend Configuration
Vite runs from the `frontend/` directory, so create `frontend/.env.local` (not a root `.env`). Replace the example values with credentials from your own Supabase project:
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3000
```
Find the project URL and client key in Supabase Dashboard → **Project Settings → API** (or **API Keys**). A placeholder URL/key cannot authenticate users. Restart the Vite server after changing this file.

For local Supabase, run `npx supabase start` and use the API URL and `anon key` printed by `npx supabase status` instead.

### 2. Backend Configuration
Create a `.env.local` inside the `/backend` directory only if you are running the Next.js backend:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. AI Food Analysis

Food images are kept in a **private** Supabase Storage bucket and sent from the authenticated Supabase Edge Function to Groq for vision analysis. Keep the provider key in Supabase Function secrets; never add it to a `VITE_` variable or the frontend environment.

Apply the nutrition schema and storage policies, then configure and deploy the function:

```bash
npx supabase db push
npx supabase secrets set GROQ_API_KEY=your_groq_api_key
npx supabase functions deploy nutrition-ai
```

The function uses Groq's `qwen/qwen3.8-27b` multimodal model by default. To choose another Groq vision model supported by your account, set the optional `GROQ_VISION_MODEL` Supabase secret. Nutrition values are estimates from the vision model; no external nutrition-database API is configured.

For local Edge Function development, put `GROQ_API_KEY` and any required local Supabase values in an untracked env file, then run `supabase functions serve nutrition-ai --env-file supabase/.env.local`. Do not commit that file.

## Running the Servers

Start both the frontend and backend servers concurrently:
```bash
npm run dev:full
```

This starts:
- Vite Dev Server: `http://localhost:8080` (or as configured)
- Next.js API Server: `http://localhost:3000`

The nutrition Edge Function and database are hosted by Supabase; the Next.js API server does not handle meal analysis.

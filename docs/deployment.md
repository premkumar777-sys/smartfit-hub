# 🚀 Deployment Guidelines

This guide details steps to deploy SmartFit AI to production.

## Frontend Deployment (Vercel or Netlify)

The React client can be compiled and deployed on standard static site hosts.

1. **Build Config**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
2. **Environment Variables**:
   - `VITE_SUPABASE_URL`: The URL of your Supabase project instance.
   - `VITE_SUPABASE_ANON_KEY`: The anonymous public client API key.
   - `VITE_API_URL`: The endpoint URL of your deployed Next.js backend.

## Backend Deployment (Vercel)

The `/backend` folder containing Next.js is configured for serverless deployment.

1. **Deploy Command**:
   - Deploy via Vercel GitHub integration or CLI `vercel --cwd backend`.
2. **Environment Variables**:
   - `STRIPE_SECRET_KEY`: Stripe API private key.
   - `STRIPE_WEBHOOK_SECRET`: Signing secret to verify webhook authenticity.
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Service bypass key (requires secret safety).
   - `NEXT_PUBLIC_SITE_URL`: Deployed domain address.

## Supabase Database Deployments

Ensure all schemas are loaded:
1. Apply the baseline schema in `supabase/schema.sql` via SQL Editor.
2. Set up RLS rules and configure bucket permissions for user challenge videos.
3. Apply the tracked migrations, including the private nutrition-image bucket and user-isolated nutrition-log policies:
   ```bash
   npx supabase db push
   ```
4. Configure the Groq vision credential as a Supabase Function secret and deploy the analyzer:
   ```bash
   npx supabase secrets set GROQ_API_KEY=your_groq_api_key
   npx supabase functions deploy nutrition-ai
   ```

`GROQ_VISION_MODEL` is optional; the default is Groq's multimodal `qwen/qwen3.8-27b`. Never put either value in a frontend `VITE_` variable. The analyzer uses model-generated composition estimates, not a connected nutrition database.

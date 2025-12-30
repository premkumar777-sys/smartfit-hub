# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/adcc6fae-2e82-490f-b7e7-51e493c60652

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/adcc6fae-2e82-490f-b7e7-51e493c60652) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database & Auth)
- Stripe (Payment Processing)

## AI Chatbot Setup (Optional)

The chatbot works with fallback responses, but for better AI-powered responses, you can configure API keys:

### Option 1: Lovable AI (Free)
1. Visit [Lovable.dev](https://lovable.dev)
2. Get your API key from your dashboard
3. Set the environment variable: `LOVABLE_API_KEY=your_key_here`

### Option 2: OpenAI (Paid but reliable)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get an API key
3. Set the environment variable: `OPENAI_API_KEY=your_key_here`
4. The free tier provides $5 credit for starters

### Option 3: HuggingFace (Free tier available)
1. Go to [HuggingFace](https://huggingface.co/)
2. Create an account and get an API token
3. Set the environment variable: `HUGGINGFACE_API_KEY=your_token_here`

The chatbot will automatically try each service in order and fall back to smart hardcoded responses if none are configured.

### Environment Variables
Create a `.env` file in your project root with your API keys:

```env
# AI Services (Optional)
LOVABLE_API_KEY=your_lovable_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here
```

## Payment Setup

This project includes Stripe integration for subscription payments. To enable payments:

### 1. Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create a new account or log in

### 2. Get API Keys
1. Go to **Developers > API keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### 3. Configure Environment Variables
Create a `.env.local` file in your project root:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Supabase (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site URL
SITE_URL=http://localhost:8080
```

### 4. Create Products in Stripe
1. Go to **Products** in Stripe Dashboard
2. Create a product called "Premium Plan"
3. Add prices:
   - Monthly: ₹199/month
   - Yearly: ₹1,999/year

### 5. Update Database Schema
Run the updated schema in your Supabase SQL editor:
1. Go to **Supabase Dashboard > SQL Editor**
2. Run the SQL from `supabase/schema.sql`

### 6. Deploy Edge Functions
```bash
# Deploy the Stripe functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### 7. Configure Webhooks
1. In Stripe Dashboard: **Developers > Webhooks**
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### 8. Update Price IDs
Update the `stripe_price_id_monthly` and `stripe_price_id_yearly` in your database with the actual price IDs from Stripe.

## Features Included

### ✅ Payment Integration
- Stripe Checkout for secure payments
- Subscription management
- Webhook handling for real-time updates

### ✅ Plan Management
- Free, Premium, and Gym Partner plans
- Monthly/Yearly billing cycles
- Automatic plan upgrades

### ✅ Feature Gating
- Premium features locked behind paywall
- AI Workout Generator requires premium
- Upgrade prompts for locked features

### ✅ Database Schema
- Plans, subscriptions, and payments tables
- Row Level Security (RLS) policies
- Helper functions for plan checks

### ✅ User Experience
- Seamless upgrade flow
- Payment success/cancel handling
- Loading states and error handling

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/adcc6fae-2e82-490f-b7e7-51e493c60652) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

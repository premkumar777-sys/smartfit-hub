# SmartFit Hub Backend - Next.js API

This is the backend API for SmartFit Hub, built with Next.js 14 and handling Stripe payments.

## 🚀 Quick Setup

### 1. Environment Variables

Create a `.env.local` file in the backend directory:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🔗 API Endpoints

### POST `/api/create-checkout-session`
Creates a Stripe checkout session for subscription payments.

**Request Body:**
```json
{
  "planId": "premium",
  "billingCycle": "monthly",
  "successUrl": "http://localhost:8081/dashboard?success=true",
  "cancelUrl": "http://localhost:8081/pricing?canceled=true"
}
```

**Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

### POST `/api/stripe-webhook`
Handles Stripe webhook events for subscription management.

## 🚀 Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
cd backend
vercel --prod
```

### 3. Set Environment Variables in Vercel

In your Vercel dashboard, go to Project Settings > Environment Variables:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### 4. Update Frontend

Update your frontend `.env` or configuration to use the Vercel URL:

```env
# In your frontend .env
VITE_API_URL=https://your-backend.vercel.app
```

### 5. Configure Stripe Webhooks

In Stripe Dashboard > Webhooks, update the endpoint to:
```
https://your-backend.vercel.app/api/stripe-webhook
```

## 🧪 Testing

### Local Testing
```bash
# Run both frontend and backend
npm run dev:full
```

### Test Payment Flow
1. Visit `http://localhost:8081/pricing`
2. Click "Upgrade to Premium"
3. Complete payment with test card: `4242 4242 4242 4242`
4. Should redirect to dashboard with success message

## 📁 Project Structure

```
backend/
├── src/
│   └── app/
│       ├── api/
│       │   ├── create-checkout-session/
│       │   │   └── route.ts
│       │   └── stripe-webhook/
│       │       └── route.ts
│       └── globals.css
├── package.json
├── next.config.js
└── README.md
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔒 Security

- JWT tokens are validated on all protected routes
- Stripe webhooks are verified using signatures
- CORS is configured for frontend communication
- Service role key is used for database operations

## 📊 Features

- ✅ Stripe checkout session creation
- ✅ Webhook event handling
- ✅ Subscription management
- ✅ Payment recording
- ✅ Database integration with Supabase
- ✅ TypeScript support
- ✅ Vercel deployment ready
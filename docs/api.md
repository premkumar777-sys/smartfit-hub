# 🔌 API Documentation

SmartFit AI leverages backend endpoints for billing integrations, database events, and generative AI streams.

## Next.js API Routes

The Next.js backend located in `/backend` serves checkout logic and webhook receivers.

### 1. Stripe Checkout Session Creation
- **Endpoint**: `/api/checkout`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "priceId": "price_...",
    "email": "user@example.com",
    "userId": "uuid-..."
  }
  ```
- **Description**: Generates a Stripe checkout session URL for purchasing Premium or B2B plans.

### 2. Stripe Webhook Listener
- **Endpoint**: `/api/webhook`
- **Method**: `POST`
- **Description**: Processes live Stripe event webhooks (`checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded`). Synchronizes status to the Supabase database.

---

## Supabase Edge Functions

Serverless Edge functions handle Gemini API chat calls.

### 1. AI Trainer Chat Stream
- **Function**: `stream-chat`
- **Trigger**: Called by Supabase Client SDK.
- **Description**: Streams context-aware conversational feedback based on fitness objectives, workout logs, and nutrition settings.

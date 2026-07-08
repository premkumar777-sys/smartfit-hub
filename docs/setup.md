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

### 1. Root / Frontend Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3000
```

### 2. Backend Configuration
Create a `.env.local` inside the `/backend` directory:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Running the Servers

Start both the frontend and backend servers concurrently:
```bash
npm run dev:full
```

This starts:
- Vite Dev Server: `http://localhost:8080` (or as configured)
- Next.js API Server: `http://localhost:3000`

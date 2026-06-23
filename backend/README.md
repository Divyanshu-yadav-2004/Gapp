# EasyCafe Backend — Setup & Deployment Guide

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+ 
- PostgreSQL (install from https://www.postgresql.org/download/windows/)
- A Cashfree merchant account (for live payments)

### Step 1 — Install Dependencies
```bash
cd backend
npm install
```

### Step 2 — Set up PostgreSQL Database
1. Install PostgreSQL on your computer
2. Open pgAdmin or psql terminal and run:
   ```sql
   CREATE DATABASE easycafe;
   ```
3. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/easycafe?schema=public"
   ```

### Step 3 — Run Prisma Database Migration
```bash
npx prisma migrate dev --name init
```

### Step 4 — Seed the Admin User
```bash
npx ts-node prisma/seed.ts
```
Default admin credentials: `admin@easycafe.com` / `AdminPassword123!`
(Change these in `.env` before going live!)

### Step 5 — Start the Backend Server
```bash
npm run start:dev
```
Backend runs at: http://localhost:3000  
Swagger API Docs: http://localhost:3000/api/docs

---

## 💳 Setting Up Real Payments (Cashfree)

### Step 1: Create Cashfree Account
1. Go to https://merchant.cashfree.com/merchants/signup
2. Register with your business details
3. Complete KYC verification (requires PAN, bank account)

### Step 2: Get API Credentials
1. Login to Cashfree dashboard
2. Go to **Developers** → **API Keys**
3. Copy your **App ID** and **Secret Key**

### Step 3: Update .env for Testing (Sandbox)
```env
CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_SECRET_KEY=your_test_secret_key_here
CASHFREE_API_URL=https://sandbox.cashfree.com/pg
```

### Step 4: Update .env for Production (Live Money)
```env
CASHFREE_APP_ID=your_live_app_id_here
CASHFREE_SECRET_KEY=your_live_secret_key_here
CASHFREE_API_URL=https://api.cashfree.com/pg
```

### How Money Reaches You
```
User pays on website
       ↓
Cashfree processes payment
       ↓
Money held in Cashfree wallet
       ↓
Auto-settled to your bank (T+2 business days)
```

---

## 📧 Setting Up Email Notifications

### Gmail Setup (Recommended for beginners)
1. Go to your Google Account → Security
2. Enable **2-Step Verification**
3. Go to **App Passwords** → Create app password for "Mail"
4. Copy the 16-character password

Update `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=EasyCafe Digital Service
ADMIN_EMAIL=your-gmail@gmail.com
```

---

## 🌐 Deployment Guide (Go Live)

### Option A: Railway (Recommended — Easy + Free Tier)
1. Sign up at https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect your GitHub repo
4. Add PostgreSQL service (Railway provides it)
5. Add all environment variables from `.env`
6. Deploy!
7. Railway gives you a URL like: `https://easycafe-backend.railway.app`

### Option B: Render (Also Free)
1. Sign up at https://render.com
2. New → Web Service → connect GitHub
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

### Option C: VPS (Advanced — DigitalOcean/Hostinger)
For production with high traffic, rent a VPS and use PM2 + Nginx.

---

## 🔗 Domain Setup (Optional but Professional)

### Do You Need a Domain?
- **For testing**: NO — you can use the free URL from Railway/Render
- **For launch**: YES — a domain makes it look professional

### How to Get a Domain
| Provider | Price | Link |
|----------|-------|------|
| GoDaddy | ~₹500/year | godaddy.com/in |
| Hostinger | ~₹100/year | hostinger.in |
| Namecheap | ~$10/year | namecheap.com |

### Connect Domain to Your App
1. Buy domain (e.g., `easycafe.in`)
2. Deploy frontend to **Netlify** (free)
3. In Netlify: Settings → Domain → Add your domain
4. In domain registrar: Update DNS to point to Netlify
5. Update CORS in backend `.env`:
   ```env
   CORS_ORIGIN=https://easycafe.in
   ```
6. Update Cashfree dashboard: Add your domain to allowed URLs

---

## 🔒 Security Checklist Before Going Live

- [ ] Change `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to strong random strings
- [ ] Change `ADMIN_EMAIL` and `ADMIN_PASSWORD` to your real credentials
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use production Cashfree API URL (not sandbox)
- [ ] Enable HTTPS on your domain (Netlify/Railway does this automatically)
- [ ] Set `CORS_ORIGIN` to your actual domain only

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/           # JWT login, refresh tokens, logout
│   ├── applications/   # Application CRUD, status updates
│   ├── payments/       # Cashfree payment + webhook handling
│   ├── notifications/  # Email service + WebSocket gateway
│   ├── uploads/        # File upload (local/S3)
│   ├── admin/          # Dashboard stats, CSV export
│   ├── common/         # Guards, decorators
│   ├── prisma/         # Database service
│   ├── app.module.ts
│   └── main.ts         # Entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Seed admin user
├── .env                # Environment variables (NEVER commit this!)
├── docker-compose.yml  # For Docker deployment
└── package.json
```

---

## 🛠 Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Admin login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| GET | `/applications/:id` | Track application (public) |
| POST | `/applications` | Submit new application (public) |
| GET | `/applications` | List all (admin) |
| PATCH | `/applications/:id/status` | Update status (admin) |
| POST | `/payments/create-order` | Create payment order |
| GET | `/payments/verify/:orderId` | Verify payment status |
| POST | `/payments/webhook` | Cashfree webhook (auto-called) |
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/export/csv` | Export CSV |
| POST | `/uploads` | Upload document |
| GET | `/api/docs` | Swagger documentation |

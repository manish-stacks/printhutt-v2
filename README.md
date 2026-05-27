# PrintHutt — Complete Project (Backend + Frontend Split)

Your original monolithic Next.js project has been split into **two
independent repositories** that run separately and talk via HTTP.

```
printhutt-complete-v2.zip
├── backend/         New Express API server (24 modules, 88 routes)
├── frontend/        Your original Next.js project (UI untouched, API calls updated)
└── README.md        This file
```

## One-time setup

### Step 1: Install both repos

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env — fill these (minimum to boot):
#   MONGO_URL=mongodb://localhost:27017/printhutt
#   REDIS_HOST=127.0.0.1
#   REDIS_PORT=6379
#   ACCESS_TOKEN_SECRET=<random 32-char string>
#   REFRESH_TOKEN_SECRET=<another random 32-char string>
#   TOKEN_SECRET=<another random — must match frontend>
#   CORS_ORIGIN=http://localhost:3000

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:4000/api
#   TOKEN_SECRET=<same value as backend's TOKEN_SECRET>
```

### Step 2: Provision MongoDB + Redis

If you don't have them locally, the easiest is Docker:

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
docker run -d --name redis -p 6379:6379 redis:7
```

### Step 3: Run

Open three terminals:

```bash
# Terminal 1 — Backend API
cd backend && npm run dev
# → API listening on http://localhost:4000

# Terminal 2 — Backend BullMQ worker (emails, order cron, cache cleanup)
cd backend && npm run worker

# Terminal 3 — Frontend
cd frontend && npm run dev
# → Next.js on http://localhost:3000
```

Verify:
```bash
curl http://localhost:4000/health
# → {"ok":true,"service":"PrintHutt"}
```

Then open http://localhost:3000 in browser. Login flow:
- User: phone/email OTP via `/login`
- Admin: email+password via `/admin/login`

## Production deployment

### Backend
```bash
cd backend
npm run build
npm start              # node dist/server.js
npm run worker:prod    # node dist/queues/worker.js
```

Deploy to any Node host (Railway / Render / Fly.io / EC2). Set:
- `NODE_ENV=production`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none` (if frontend on different domain)
- `CORS_ORIGIN=https://yourdomain.com`

Don't forget to:
- Point Razorpay webhook URL to `https://api.yourdomain.com/api/payment/razorpay/webhooks`
- Point PhonePe callback URL to `https://api.yourdomain.com/api/payment/callback`
- Set `APP_URL=https://yourdomain.com` for redirect URLs

### Frontend
Deploy `frontend/` to Vercel / Netlify / any Next.js host. Set:
- `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`
- `TOKEN_SECRET=<same as backend>`

## Module reference

### Backend modules (24)
auth, users, categories, subcategories, products, cart, wishlist, addresses,
coupons, orders, reviews, offers, sliders, testimonials, blogs, blog-categories,
warranty, return-policy, shipping, personalized-gifts, visitors, upload,
dashboard, payment

### Frontend structure (unchanged)
- 94 pages in `src/app/` — all original pages preserved
- 106 components in `src/components/` — all original components preserved
- 6 Zustand stores in `src/store/` — useUserStore + useCartStore updated, rest untouched
- 27 service files in `src/_services/` — all URLs updated

## Files preserved vs modified

| Category | Status |
|---|---|
| Pages | ✅ All 94 preserved |
| Components | ✅ All 106 preserved |
| Public assets | ✅ All preserved (images, fonts, manifest, sw.js) |
| Tailwind / PostCSS / ESLint config | ✅ Preserved |
| Mongoose models | 📦 Moved to backend |
| API routes | 📦 Moved to backend → Express modules |
| Email templates | 📦 Moved to backend |
| Cloudinary/S3 upload | 📦 Moved to backend |
| `utils/axios.ts` | 🔧 Updated (refresh interceptor) |
| `store/useUserStore.ts` | 🔧 Updated (uses axiosInstance) |
| `store/useCartStore.ts` | 🔧 Updated (one line — cart endpoint) |
| `middleware.ts` | ✅ Unchanged behaviour |
| `_services/admin/*` | 🔧 URL paths updated |
| `_services/common/*` | 🔧 URL paths updated |
| 15 pages/components | 🔧 `axios.X(...)` → `axiosInstance.X(...)` |
| `helpers/helpers.ts` | 🔧 Backend-only helpers removed |
| `package.json` | 🔧 Backend deps removed |

## Architecture

```
┌──────────────────┐   cookies + JSON      ┌────────────────────────┐
│  Next.js client  │ ────────────────────► │  Express API server    │
│  (frontend/)     │ ◄──────────────────── │  (backend/)            │
│                  │                       │                        │
│  • All UI pages  │                       │  ┌──────────────────┐  │
│  • Components    │                       │  │ MongoDB          │  │
│  • Zustand state │                       │  │ Redis (cache +   │  │
│  • Auto-refresh  │                       │  │   refresh store) │  │
│    on 401        │                       │  │ BullMQ worker    │  │
└──────────────────┘                       │  │ S3 (uploads)     │  │
                                           │  │ SMTP (mailer)    │  │
                                           │  └──────────────────┘  │
                                           └────────────────────────┘
```

## What to test first

1. **Health** — `curl http://localhost:4000/health`
2. **Frontend boots** — visit `/`
3. **Storefront API** — homepage loads sliders, products, categories
4. **Login (user)** — request OTP via `/login`, verify, redirect to `/user/dashboard`
5. **Login (admin)** — `/admin/login` with email+password, redirect to `/admin/dashboard`
6. **Admin dashboard** — stats load, revenue charts render
7. **Add to cart + checkout** — full order flow
8. **Razorpay payment** — gateway opens, payment captures, order confirmed
9. **Refresh token** — wait 15min, do any action, verify auto-refresh

If anything fails, check:
- Backend `npm run dev` console for errors
- Frontend browser console for 4xx/5xx responses
- That `TOKEN_SECRET` matches exactly in both `.env` files
- That `CORS_ORIGIN` in backend includes your frontend URL

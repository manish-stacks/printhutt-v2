# PrintHutt — Frontend (Backend-Decoupled)

This is your **original Next.js project** with **only the backend bits removed
and the API calls re-pointed to the new Express backend**. UI, pages, layouts,
components, styles, public assets — everything else is untouched.

## What changed vs your original project

### Removed (now in the separate backend repo)
- `src/app/api/**` — all 88 API route handlers
- `src/models/**` — Mongoose models
- `src/dbConfig/**` — MongoDB connection
- `src/lib/cloudinary.ts` — S3/Cloudinary upload utility
- `src/lib/mail/**` — nodemailer + email templates
- `src/lib/orderReminderCron.ts` — pending-order cron
- `src/lib/phonepay.ts` — PhonePe gateway
- `src/helpers/getDataFromToken.ts` — server-side token decoder
- `ecosystem.config.js` — PM2 config (move to backend if needed)

### Modified
- `src/utils/axios.ts` — new base URL + auto-refresh on 401 + proper TS types
- `src/store/useUserStore.ts` — uses axiosInstance, listens to 'auth:expired'
- `src/store/useCartStore.ts` — session cart now hits /cart on backend
- `src/middleware.ts` — unchanged behaviour (verifies legacy 'token' cookie)
- `src/helpers/helpers.ts` — kept frontend helpers, removed backend helpers
- `src/_services/admin/*.ts` (15 files) — URLs updated for backend
- `src/_services/common/*.ts` (12 files) — same URL updates
- 15 pages/components — axios calls switched to axiosInstance
- `package.json` — removed backend-only deps
- `tsconfig.json` — removed dangling src/models references
- `.env.example` — new env vars

### Untouched
- All 94 pages under `src/app/`
- All 106 components under `src/components/`
- All other stores (useCartSidebarStore, useQuickStore, usWishlistStore, useSession)
- Hooks (useOtp)
- Types (`src/lib/types/`)
- Tailwind, PostCSS, ESLint configs
- `public/` — assets, fonts, manifest, service worker
- PWA configuration

## Getting started

```bash
# 1. Install deps
npm install

# 2. Set up env
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:4000/api
#   TOKEN_SECRET=<must match backend's TOKEN_SECRET exactly>

# 3. Start backend (separate terminal, in backend repo)
# (cd ../backend && npm run dev)

# 4. Start frontend
npm run dev
```

Open http://localhost:3000.

## URL mapping reference (summary)

All `/api/*` routes have been replaced with backend-relative URLs:

- `/api/auth/X` → `/auth/X`
- `/api/product*` → `/products*`
- `/api/category*` → `/categories*`
- `/api/sub-category*` → `/subcategories*`
- `/api/coupon*` → `/coupons*`
- `/api/order*` → `/orders*`
- `/api/offer*` → `/offers*`
- `/api/slider*` → `/sliders*`
- `/api/testimonial*` → `/testimonials*`
- `/api/blog*` → `/blogs*`
- `/api/blog/category*` → `/blog-categories*`
- `/api/address*` → `/addresses*`
- `/api/user*` → `/users*`
- `/api/v1/wishlist` → `/wishlist`
- `/api/v1/personalized-gifts` → `/personalized-gifts/storefront`
- `/api/v1/X` storefront endpoints → `/X/storefront`
- `/api/session-cart` → `/cart`
- `/api/fship/track` → `/shipping/track`
- `/api/shiprocket/X` → `/shipping/shiprocket/X`
- `/api/payment/X` → `/payment/X` (unchanged)
- `/api/dashboard` → `/dashboard` (unchanged)
- `/api/visitors` → `/visitors` (unchanged)

## Auth flow

1. User submits login form → POST /auth/login or POST /auth/admin-login
2. Backend issues 3 cookies (httpOnly): access_token (15m), refresh_token (30d),
   token (legacy — for middleware verification)
3. Backend also returns accessToken in response body (for mobile clients)
4. Frontend axiosInstance automatically sends cookies (withCredentials: true)
5. When access_token expires, the response interceptor automatically calls
   /auth/refresh and retries the original request — user sees no interruption
6. src/middleware.ts verifies the token cookie locally (no network hop) for
   /admin/* and /user/* route protection

## Notes

- next.config.ts keeps `ignoreBuildErrors: true` in production — your original
  project had pre-existing TypeScript errors in some pages that are not from
  this migration. They build fine in production.

- The `pages/` folder under `src/pages/` is not Next.js pages — they're
  components imported by `src/app/` layouts.

- All `_services/*` functions still return Promises that resolve to the JSON
  body directly (axiosInstance interceptor unwraps response.data).

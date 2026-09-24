# PrintHutt — Backend

Extracted from the original monolithic Next.js app. Same Mongoose models, same business behaviour, now served from a dedicated Express + TypeScript API.

## Stack

- Node.js + Express 4
- TypeScript **strict mode** (no `any`, no `@ts-ignore`)
- MongoDB + Mongoose 8 (models ported 1:1)
- Redis (ioredis) — cache + refresh-token store
- BullMQ — emails / order processing / cache cleanup / pending-order cron
- JWT (jsonwebtoken) — access + refresh + rotation
- Zod — request validation
- Helmet, CORS, compression, rate-limit
- AWS S3 — same uploads as before (file ported from `src/lib/cloudinary.ts`)
- Multer — multipart uploads (replaces Next FormData parsing)

## Layout

```
src/
├── app.ts                  Express app factory (mounts all routers)
├── server.ts               Bootstrap — connectDB, listen, graceful shutdown
├── config/
│   ├── env.ts              zod-validated env loader
│   └── logger.ts           winston
├── db/
│   ├── connection.ts       mongoose connect / disconnect
│   └── models/             ← all 19 Mongoose models ported verbatim
├── redis/
│   └── client.ts           ioredis + BullMQ conn + cache helpers
├── queues/
│   ├── queues.ts           BullMQ Queue factories + producers
│   └── worker.ts           separate worker entrypoint
├── jobs/                   BullMQ processors
├── middlewares/            auth / role / error / validation / rate-limit / upload
├── utils/
│   ├── jwt.ts              access + refresh + legacy token signing
│   ├── cookies.ts          secure-cookie helpers
│   ├── errors.ts           AppError, BadRequest, Unauthorized, NotFound …
│   ├── async-handler.ts
│   ├── api-response.ts
│   ├── helpers.ts          ported from src/helpers/helpers.ts
│   ├── storage.ts          ported from src/lib/cloudinary.ts (S3)
│   └── mail/               ported from src/lib/mail/* (mailer + templates)
├── modules/                each module = controller + service + repository + routes + validation
│   ├── auth/               ← fully ported (login/admin-login/signup/verify-otp/me/refresh/logout)
│   ├── products/           ← reference impl (list / create / patch / delete / image-delete)
│   ├── orders/             ← scaffolded — port from src/app/api/order/**
│   ├── cart/               ← scaffolded — port from src/app/api/session-cart/route.ts
│   ├── dashboard/          ← scaffolded — port from src/app/api/dashboard/route.ts
│   └── … 19 more
└── types/                  shared TypeScript types (ported from src/lib/types/*)
```

## Getting started

```bash
cp .env.example .env
# fill in MONGO_URL, REDIS_*, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, TOKEN_SECRET, S3, SMTP …

npm install
npm run dev      # API
npm run worker   # BullMQ worker (run in a separate terminal)
```

Production:

```bash
npm run build
npm start            # node dist/server.js
npm run worker:prod  # node dist/queues/worker.js
```

## Auth flow

1. `POST /api/auth/login` `{ emailOrMobile }` → enqueues OTP email/SMS (BullMQ).
2. `POST /api/auth/verify-otp` `{ otp, emailOrMobile }` → issues:
   - `access_token` httpOnly cookie (15m)
   - `refresh_token` httpOnly cookie (30d) — `tokenId` stored in Redis
   - `token` legacy cookie — kept so the existing Next.js middleware still works
   - Body also contains `accessToken` for native/mobile clients
3. `POST /api/auth/refresh` (cookie) → rotates: revokes the old `tokenId` in Redis, issues a fresh pair.
4. `GET  /api/auth/logout` → revokes the single refresh tokenId + clears cookies.
5. `POST /api/auth/logout-all` → wipes every `refresh:{userId}:*` entry.

`POST /api/auth/admin-login` and `POST /api/auth/signup` work the same way as the old routes; same response shape.

## Caching

Redis cache helpers exposed in `src/redis/client.ts` (`cacheGet` / `cacheSet` / `cacheDel` / `cacheDelPattern`). Used by `products.service.storefrontList` as the reference pattern — wire the same into categories / blogs / dashboard / offers / sliders / testimonials.

Invalidate on writes — call `cacheDelPattern('products:*')` etc. inside the service's mutation paths.

## Background jobs (BullMQ)

| Queue           | When                    | Processor                                   |
|-----------------|-------------------------|---------------------------------------------|
| `email`         | OTP/verify/reset/order  | `jobs/email.processor.ts` → `utils/mail/*`  |
| `order`         | Per-order + cron        | `jobs/order.processor.ts`                   |
| `cache-cleanup` | After bulk mutation     | `jobs/cache-cleanup.processor.ts`           |

The pending-order reminder cron (`src/app/api/cron/pending-order-reminder`) is replaced by a repeatable BullMQ job (`pending-reminder-cron`) scheduled in `queues/worker.ts`.

## Module migration status

| Module              | Status     | Original route(s)                                                  |
|---------------------|------------|--------------------------------------------------------------------|
| auth                | **done**   | `src/app/api/auth/**`                                              |
| products            | **reference** | `src/app/api/product/**`, `src/app/api/v1/products/**`         |
| users               | scaffolded | `src/app/api/user/**`, `src/app/api/v1/user/**`                    |
| categories          | scaffolded | `src/app/api/category/**`, `src/app/api/v1/categories/**`          |
| subcategories       | scaffolded | `src/app/api/sub-category/**`                                      |
| orders              | scaffolded | `src/app/api/order/**`                                             |
| coupons             | scaffolded | `src/app/api/coupon/**`, `src/app/api/v1/coupon/route.ts`          |
| reviews             | scaffolded | `src/app/api/reviews/**`                                           |
| wishlist            | scaffolded | `src/app/api/v1/wishlist/**`                                       |
| cart                | scaffolded | `src/app/api/session-cart/route.ts`                                |
| blogs               | scaffolded | `src/app/api/blog/**`, `src/app/api/v1/blog-posts/**`              |
| blog-categories     | scaffolded | `src/app/api/blog/category/**`                                     |
| personalized-gifts  | scaffolded | `src/app/api/v1/personalized-gifts/**`                             |
| shipping            | scaffolded | `src/app/api/shipping/**`, `src/app/api/fship/**`, shiprocket/**   |
| warranty            | scaffolded | `src/app/api/warranty/**`                                          |
| return-policy       | scaffolded | `src/app/api/return-policy/**`                                     |
| offers              | scaffolded | `src/app/api/offer/**`                                             |
| sliders             | scaffolded | `src/app/api/slider/**`                                            |
| testimonials        | scaffolded | `src/app/api/testimonial/**`                                       |
| addresses           | scaffolded | `src/app/api/address/**`                                           |
| dashboard           | scaffolded | `src/app/api/dashboard/route.ts`                                   |
| visitors            | scaffolded | `src/app/api/visitors/route.ts`                                    |
| payment             | scaffolded | `src/app/api/payment/**`                                           |
| upload              | scaffolded | `src/app/api/get-signed-url/route.ts`                              |

**Scaffolded** = controller/service/repository/routes/validation files exist with TODO stubs. The Mongoose model is already wired. Port the original Next.js handler body line-for-line into the service method; the response shape must stay identical.

Use the `auth/` and `products/` modules as the reference. They demonstrate the conventions: thin controller → service → repository, zod validation, error throwing instead of `NextResponse.json({status:4xx})`.

## Security

- `helmet`, CORS allowlist (`CORS_ORIGIN` env, comma-separated)
- `express-rate-limit` global + tighter `authLimiter`
- httpOnly + sameSite cookies (Secure in production)
- Zod input validation everywhere
- Mongoose `strictQuery`
- Refresh-token rotation + revocation list in Redis

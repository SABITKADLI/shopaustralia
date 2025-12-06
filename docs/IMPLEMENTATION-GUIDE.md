# Full-Stack Implementation Guide
## Smart Dropshipping Comparison Engine

**Project:** shopaustralia  
**Repository:** https://github.com/SABITKADLI/shopaustralia  
**Status:** Production-Ready Blueprint  
**Date:** December 6, 2025

---

## TABLE OF CONTENTS

1. [Project Architecture Overview](#project-architecture-overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Comparison Engine Logic](#comparison-engine-logic)
6. [Shopify Integration](#shopify-integration)
7. [Legal & Professional Pages](#legal--professional-pages)
8. [Environment Configuration](#environment-configuration)
9. [Step-by-Step Implementation Plan](#step-by-step-implementation-plan)
10. [Deployment Checklist](#deployment-checklist)

---

## PROJECT ARCHITECTURE OVERVIEW

This is a **headless Shopify storefront** with a custom comparison engine, not a traditional Shopify theme.

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER LAYER                           │
│  Next.js Storefront (SSR/SSG) + Tailwind UI                 │
│  - Product pages with real-time supplier comparison         │
│  - Cart, checkout redirect to Shopify                       │
│  - Tracking, RMA portal                                     │
└─────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              API GATEWAY LAYER                              │
│  Express.js REST API + GraphQL (optional)                   │
│  - Authentication & Authorization (JWT)                     │
│  - Webhook ingestion (Shopify events)                       │
│  - Comparison engine orchestration                          │
└─────────────────────────────────────────────────────────────┘
                          ▼
┌──────────────────────┬──────────────────┬──────────────────┐
│ COMPARISON ENGINE    │  DATABASE LAYER  │  EXTERNAL APIS   │
│                      │                  │                  │
│ - Product mapping    │ PostgreSQL:      │ - AutoDS API     │
│ - Price comparison   │   suppliers      │ - Spocket API    │
│ - ETA calculation    │   products       │ - Zendrop API    │
│ - Scoring logic      │   mappings       │ - Shopify Admin  │
│                      │   pricing_rules  │   API            │
│                      │   orders         │                  │
└──────────────────────┴──────────────────┴──────────────────┘
```

---

## REPOSITORY STRUCTURE

Your `/shopaustralia` repo will have **3 main subdirectories**:

```
/shopaustralia (monorepo root)
│
├── apps/
│   ├── storefront/                    # Next.js customer-facing UI
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                  # Homepage
│   │   │   ├── products/
│   │   │   │   └── [handle]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── loading.tsx
│   │   │   ├── api/
│   │   │   │   └── compare/
│   │   │   │       └── route.ts           # /api/compare?productId=...
│   │   │   ├── portal/
│   │   │   │   ├── orders/
│   │   │   │   ├── tracking/
│   │   │   │   └── rma/
│   │   │   └── legal/
│   │   │       ├── privacy/
│   │   │       ├── terms/
│   │   │       └── shipping/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Navigation.tsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Skeleton.tsx
│   │   │   └── product/
│   │   │       ├── ProductGallery.tsx
│   │   │       ├── SupplierComparisonTable.tsx
│   │   │       ├── SupplierRow.tsx
│   │   │       └── AddToCartButton.tsx
│   │   ├── lib/
│   │   │   ├── shopify/
│   │   │   │   ├── client.ts              # Storefront API client
│   │   │   │   ├── queries.ts             # GraphQL queries
│   │   │   │   └── types.ts
│   │   │   ├── comparison/
│   │   │   │   ├── types.ts               # SupplierOption interface
│   │   │   │   └── mappers.ts
│   │   │   ├── api.ts                     # Backend API client
│   │   │   └── utils.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── .env.local                     # Storefront env vars
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                              # Node.js Express backend
│       ├── src/
│       │   ├── index.ts                  # Entry point
│       │   ├── middleware/
│       │   │   ├── auth.ts
│       │   │   ├── errorHandler.ts
│       │   │   └── cors.ts
│       │   ├── routes/
│       │   │   ├── products.ts
│       │   │   ├── webhooks.ts           # Shopify webhook handlers
│       │   │   ├── comparison.ts         # /comparison endpoints
│       │   │   ├── orders.ts
│       │   │   └── health.ts
│       │   ├── services/
│       │   │   ├── comparison/
│       │   │   │   ├── index.ts          # Main comparison engine
│       │   │   │   ├── priceComparison.ts
│       │   │   │   ├── etaCalculator.ts
│       │   │   │   └── scoringEngine.ts
│       │   │   ├── shopify/
│       │   │   │   ├── adminClient.ts
│       │   │   │   ├── webhookHandler.ts
│       │   │   │   └── productSync.ts
│       │   │   ├── supplier/
│       │   │   │   ├── autods.ts
│       │   │   │   ├── spocket.ts
│       │   │   │   └── zendrop.ts
│       │   │   └── database/
│       │   │       ├── migrations.ts
│       │   │       └── seeds.ts
│       │   ├── models/
│       │   │   ├── Product.ts
│       │   │   ├── Supplier.ts
│       │   │   ├── Order.ts
│       │   │   └── ComparisonSession.ts
│       │   ├── db/
│       │   │   ├── connection.ts         # PostgreSQL pool
│       │   │   ├── schema.sql            # Schema definitions
│       │   │   └── queries.ts            # Prepared statements
│       │   └── config/
│       │       └── env.ts
│       ├── .env                          # Backend env vars
│       ├── .env.example
│       ├── server.ts
│       ├── tsconfig.json
│       ├── package.json
│       └── Dockerfile
│
├── packages/                             # Shared code (optional)
│   └── types/
│       ├── index.ts
│       ├── supplier.ts
│       ├── comparison.ts
│       └── shopify.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── TROUBLESHOOTING.md
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── deploy.yml
│
├── .gitignore
├── README.md
├── pnpm-workspace.yaml                  # If using monorepo
└── docker-compose.yml                   # Local development

```

---

## TECHNOLOGY STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14+ (App Router) | SSR/SSG, fast performance, SEO |
| **Styling** | Tailwind CSS + Headless UI | Utility-first, accessible components |
| **State** | React hooks + TanStack Query | Client state, API caching |
| **Backend** | Express.js + TypeScript | REST API, webhook handling |
| **Database** | PostgreSQL 15+ | Relational data, ACID compliance |
| **ORM** | Prisma or node-postgres | Type-safe queries |
| **Authentication** | JWT (simple) or Auth0 (enterprise) | API auth, merchant portal |
| **Job Queue** | Bull + Redis | Async tasks (order routing, tracking) |
| **Comparison Engine** | Node.js service | Real-time product comparison logic |
| **Shopify Integration** | Storefront API + Admin API | Product fetch, order webhooks |
| **Hosting** | Render or Railway | Serverless/container deployment |
| **CDN** | Cloudflare | Static assets, edge caching |
| **Monitoring** | Sentry + LogRocket | Error tracking, performance |
| **Payment** | Stripe (via Shopify) | Transaction processing |

---

## DATABASE SCHEMA

### PostgreSQL Tables (Production)

**Core Tables:**

1. **suppliers** – Third-party fulfillment partners
2. **supplier_products** – Products from each supplier
3. **shopify_product_mappings** – Link Shopify products → supplier products
4. **pricing_rules** – Dynamic margin rules
5. **comparison_sessions** – Track comparison page views
6. **orders** – Order details (denormalized from Shopify)
7. **shipments** – Tracking info (polled from suppliers)
8. **rma_requests** – Return/replacement requests
9. **audit_logs** – Admin action tracking

**Full SQL schema provided in separate file: `DATABASE.md`**

---

## COMPARISON ENGINE LOGIC

### High-Level Flow

```
Customer views product → Frontend calls /api/compare?shopifyProductId=...
                              ↓
                    Backend queries:
                    - Shopify product details
                    - Supplier products (cached)
                    - Current pricing rules
                              ↓
                    Comparison engine runs:
                    1. Match Shopify product → supplier product IDs
                    2. Fetch real-time price from each supplier API
                    3. Calculate ETAs (based on supplier speed profile)
                    4. Score each option (price, speed, rating)
                    5. Return ranked array of SupplierOption[]
                              ↓
                    Frontend renders options, customer selects
                              ↓
                    Customer adds to cart → line_item.properties.supplier_id
                              ↓
                    Webhook: order/created → Backend routes order to selected supplier
```

### Comparison Algorithm Pseudocode

```typescript
async function compareSuppliers(shopifyProductId: string): Promise<SupplierOption[]> {
  // 1. Get product metadata (title, category)
  const shopifyProduct = await shopify.getProduct(shopifyProductId);
  
  // 2. Find all supplier products that match this product
  const mappings = await db.query(
    `SELECT * FROM shopify_product_mappings WHERE shopify_product_id = $1`,
    [shopifyProductId]
  );
  
  // 3. For each mapping, fetch real-time supplier data
  const options = await Promise.all(
    mappings.map(async (mapping) => {
      // 3a. Get current price from supplier API
      const price = await suppliers[mapping.supplierName].getPrice(mapping.externalProductId);
      
      // 3b. Get ETA (static profile or dynamic API call)
      const etaDays = getETAForSupplier(mapping.supplierName, shopifyProduct.category);
      
      // 3c. Get rating (from cached supplier metrics)
      const rating = await getCachedRating(mapping.supplierId);
      
      // 3d. Apply pricing rules (markup/margin)
      const rule = await getPricingRule(shopifyProductId, mapping.supplierId);
      const finalPrice = price * (1 + rule.marginPercentage);
      
      // 3e. Calculate score (lower = better)
      const score = calculateScore(finalPrice, etaDays, rating);
      
      return {
        id: mapping.id,
        supplierName: mapping.supplierName,
        price: finalPrice,
        currency: 'AUD',
        etaDays,
        rating,
        isBestValue: false,    // Will set after sorting
        isFastest: false,      // Will set after sorting
        inStock: true,
      };
    })
  );
  
  // 4. Sort and tag best options
  const sorted = options.sort((a, b) => a.score - b.score);
  sorted[0].isBestValue = true;
  
  const fastest = options.sort((a, b) => a.etaDays - b.etaDays)[0];
  fastest.isFastest = true;
  
  return sorted;
}
```

---

## SHOPIFY INTEGRATION

### Webhooks to Register

In your Shopify Custom App, register these webhooks:

1. **products/create** → Sync new products
2. **products/update** → Update product mappings
3. **orders/create** → Route order to supplier
4. **orders/fulfilled** → Update customer tracking
5. **customers/create** → Segment for marketing

### Webhook Handler Pattern

```typescript
// POST /webhooks/shopify/orders/create
async function handleOrderCreated(req: Request, res: Response) {
  const { orderId, lineItems } = req.body;
  
  // 1. Extract supplier selection from line item properties
  const supplierChoice = lineItems[0]?.properties?.supplier_id;
  
  // 2. Look up supplier details
  const supplier = await db.query(`SELECT * FROM suppliers WHERE id = $1`, [supplierChoice]);
  
  // 3. Call supplier API to create order
  const supplierOrderId = await suppliers[supplier.name].createOrder({...});
  
  // 4. Store in DB for tracking
  await db.query(
    `INSERT INTO orders (shopify_order_id, supplier_order_id, supplier_id) VALUES ($1, $2, $3)`,
    [orderId, supplierOrderId, supplierChoice]
  );
  
  res.status(200).json({ success: true });
}
```

---

## LEGAL & PROFESSIONAL PAGES

### Required Pages (Australian)

1. **Privacy Policy** – GDPR/AU Privacy Act compliance
2. **Terms & Conditions** – Liability, usage terms
3. **Shipping & Returns Policy** – Clear expectations
4. **FAQ** – Common questions
5. **Contact Us** – Support channels
6. **About** – Company story
7. **Refund Policy** – Money-back guarantee
8. **Cookie Policy** – If tracking users

### Page Structure (Next.js)

```
app/
  legal/
    privacy/page.tsx          → /legal/privacy
    terms/page.tsx            → /legal/terms
    shipping/page.tsx         → /legal/shipping
    refund/page.tsx           → /legal/refund
    cookies/page.tsx          → /legal/cookies
  about/page.tsx              → /about
  contact/page.tsx            → /contact
  faq/page.tsx                → /faq
```

---

## ENVIRONMENT CONFIGURATION

### Frontend (.env.local)

```env
# Shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN=shpat_xxxxx
NEXT_PUBLIC_SHOPIFY_API_VERSION=2024-10

# Backend
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com (or http://localhost:3001)

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-xxxxxx
```

### Backend (.env)

```env
# Node
NODE_ENV=production
PORT=3001

# Shopify Admin
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxx
SHOPIFY_API_VERSION=2024-10

# Suppliers
AUTODS_API_KEY=sk_live_xxxxx
SPOCKET_API_KEY=sp_xxxxx
ZENDROP_API_KEY=zend_xxxxx

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shopaustralia

# JWT
JWT_SECRET=your-secret-key-32-chars-min

# Redis
REDIS_URL=redis://localhost:6379

# Webhook
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret

# Environment
ENVIRONMENT=production
```

---

## STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 1: Local Setup (Day 1)

1. **Clone the monorepo**
   ```bash
   git clone https://github.com/SABITKADLI/shopaustralia.git
   cd shopaustralia
   ```

2. **Initialize package managers**
   ```bash
   npm install -g pnpm  # or use yarn
   pnpm install
   ```

3. **Create environment files**
   ```bash
   cp apps/storefront/.env.example apps/storefront/.env.local
   cp apps/api/.env.example apps/api/.env
   ```

4. **Populate environment variables** (from your Shopify + supplier accounts)

5. **Start PostgreSQL locally**
   ```bash
   docker-compose up -d postgres redis
   ```

### Phase 2: Database Setup (Day 2)

6. **Run migrations**
   ```bash
   cd apps/api
   pnpm run db:migrate
   ```

7. **Seed test data**
   ```bash
   pnpm run db:seed
   ```

8. **Verify schema**
   ```bash
   psql postgresql://user:password@localhost:5432/shopaustralia -c "\dt"
   ```

### Phase 3: Backend Development (Days 3–5)

9. **Start backend server**
   ```bash
   cd apps/api
   pnpm run dev
   ```

10. **Test comparison engine**
    ```bash
    curl http://localhost:3001/api/compare?shopifyProductId=gid://shopify/Product/123
    ```

11. **Wire Shopify webhooks** (Admin panel)
    - Settings → Notifications → Webhooks
    - Add endpoint: `https://api.yourdomain.com/webhooks/shopify/orders/create`

### Phase 4: Frontend Development (Days 6–8)

12. **Start storefront**
    ```bash
    cd apps/storefront
    pnpm run dev
    ```

13. **Build product page with comparison**
    - Fetch product from Shopify Storefront API
    - Call `/api/compare` endpoint
    - Render `SupplierComparisonTable`

14. **Implement cart logic**
    - Store `supplier_id` in line-item properties
    - Redirect to Shopify checkout

### Phase 5: Legal Pages (Day 9)

15. **Generate legal templates** (using LawPath or Rocket Lawyer AU)
    - Update `/legal/privacy.tsx`, `/legal/terms.tsx`, etc.

### Phase 6: Testing & Deployment (Days 10–12)

16. **Local end-to-end testing**
    - Create test order from storefront
    - Verify order reaches supplier
    - Check tracking updates

17. **Deploy to staging** (Render/Railway)
    ```bash
    git push origin main  # triggers CI/CD
    ```

18. **Run QA checklist**
    - Mobile responsiveness
    - Payment processing
    - Supplier API failover

19. **Deploy to production**
    - DNS cutover to new domain
    - Monitor for 24 hours

---

## DEPLOYMENT CHECKLIST

- [ ] All environment variables set in production
- [ ] Database backups configured (daily, 7-day retention)
- [ ] SSL certificate active (Let's Encrypt or Cloudflare)
- [ ] Monitoring + alerts set up (Sentry, Uptime Robot)
- [ ] Shopify webhooks registered and tested
- [ ] Error handling + logging enabled
- [ ] Rate limiting on API endpoints
- [ ] CORS configured correctly
- [ ] Legal pages reviewed by AU legal counsel
- [ ] Performance tested (Lighthouse >90)
- [ ] Security audit completed (OWASP top 10)
- [ ] Runbooks created for common issues
- [ ] Team trained on incident response

---

## NEXT STEPS

1. Start with **Phase 1: Local Setup**
2. Build **database schema** (see DATABASE.md)
3. Implement **comparison engine core logic**
4. Wire **Shopify Storefront API** product fetching
5. Build **UI components** (SupplierComparisonTable, etc.)
6. Test **end-to-end** flow (product → cart → order)

**Estimated timeline:** 2–3 weeks to MVP with one developer.

---

**Questions? Check:**
- `docs/ARCHITECTURE.md` – System design deep dive
- `docs/API.md` – Endpoint reference
- `docs/TROUBLESHOOTING.md` – Common issues

**Ready to code? Start with the file stubs in the next sections.**
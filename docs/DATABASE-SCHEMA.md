# DATABASE SCHEMA & SYNCHRONIZATION STRATEGY
## Smart Dropshipping Comparison Engine

---

## PostgreSQL Schema (Production-Ready)

### Table 1: suppliers
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  api_identifier VARCHAR(50) UNIQUE NOT NULL,
  api_key_encrypted VARCHAR(255) NOT NULL,
  base_url VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 1,
  avg_eta_days INT DEFAULT 5,
  reliability_score DECIMAL(3,2) DEFAULT 0.95,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO suppliers (name, api_identifier, base_url, avg_eta_days) VALUES
  ('AutoDS', 'autods', 'https://api.autods.com', 5),
  ('Spocket', 'spocket', 'https://api.spocket.co', 8),
  ('Zendrop', 'zendrop', 'https://api.zendrop.com', 6);
```

### Table 2: supplier_products
```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  external_product_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  brand VARCHAR(100),
  category VARCHAR(100),
  base_price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  stock_status VARCHAR(50),
  rating DECIMAL(3,2) DEFAULT 0.0,
  review_count INT DEFAULT 0,
  sku VARCHAR(100),
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(supplier_id, external_product_id)
);

CREATE INDEX idx_supplier_products_title ON supplier_products(title);
CREATE INDEX idx_supplier_products_category ON supplier_products(category);
```

### Table 3: shopify_product_mappings
Connects Shopify products to supplier products
```sql
CREATE TABLE shopify_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_product_id VARCHAR(255) NOT NULL,
  shopify_product_handle VARCHAR(255),
  supplier_product_id UUID NOT NULL REFERENCES supplier_products(id),
  mapping_confidence DECIMAL(3,2) DEFAULT 0.95,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(shopify_product_id, supplier_product_id)
);

CREATE INDEX idx_shopify_mappings_product_id ON shopify_product_mappings(shopify_product_id);
```

### Table 4: pricing_rules
Dynamic margin/discount rules
```sql
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50), -- 'global', 'supplier', 'category', 'product'
  target_id UUID,
  margin_percentage DECIMAL(5,2) DEFAULT 20.0,
  margin_absolute DECIMAL(12,2),
  discount_percentage DECIMAL(5,2) DEFAULT 0.0,
  min_price DECIMAL(12,2),
  max_price DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example rules
INSERT INTO pricing_rules (rule_name, rule_type, margin_percentage, is_active) VALUES
  ('Global 25% Margin', 'global', 25.00, true);

INSERT INTO pricing_rules (rule_name, rule_type, target_id, margin_percentage) VALUES
  ('AutoDS Premium', 'supplier', (SELECT id FROM suppliers WHERE api_identifier = 'autods'), 30.00);
```

### Table 5: comparison_sessions
Track when customers view comparisons (analytics)
```sql
CREATE TABLE comparison_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_product_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  selected_supplier_id UUID REFERENCES suppliers(id),
  time_to_decision INT,
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comparison_sessions_product_id ON comparison_sessions(shopify_product_id);
```

### Table 6: orders
Denormalized order data from Shopify
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id VARCHAR(255) UNIQUE NOT NULL,
  shopify_customer_id VARCHAR(255),
  selected_supplier_id UUID REFERENCES suppliers(id),
  supplier_order_id VARCHAR(255),
  total_price DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'AUD',
  status VARCHAR(50), -- 'pending', 'placed', 'shipped', 'delivered', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_shopify_order_id ON orders(shopify_order_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### Table 7: shipments
Tracking information polled from suppliers
```sql
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  status VARCHAR(50), -- 'not_shipped', 'in_transit', 'delivered', 'failed'
  current_location VARCHAR(255),
  estimated_delivery DATE,
  actual_delivery_date DATE,
  last_updated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipments_order_id ON shipments(order_id);
```

### Table 8: rma_requests
Return/exchange requests
```sql
CREATE TABLE rma_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  reason VARCHAR(255),
  status VARCHAR(50), -- 'pending', 'approved', 'rejected', 'completed'
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_rma_requests_status ON rma_requests(status);
```

### Table 9: audit_logs
Admin action tracking
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(255),
  actor_id VARCHAR(255),
  target_type VARCHAR(50),
  target_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## Data Synchronization Strategy

### Real-Time Sync: Shopify → Backend

**Trigger:** Webhook subscription to `products/create`, `products/update`

**Flow:**
1. Shopify sends webhook to `POST /webhooks/shopify/products/update`
2. Backend receives product event
3. Backend extracts product ID, title, category, price
4. Backend queries supplier products matching title/category
5. Backend inserts/updates records in `shopify_product_mappings`

**Code (Node.js):**
```typescript
// apps/api/src/services/shopify/webhookHandler.ts

async function handleProductUpdate(product: ShopifyProduct) {
  const { id: shopifyProductId, title, productType, variants } = product;

  // 1. Search for matching supplier products
  const matches = await db.query(`
    SELECT sp.*, s.name as supplier_name
    FROM supplier_products sp
    JOIN suppliers s ON sp.supplier_id = s.id
    WHERE sp.title ILIKE $1 OR sp.category ILIKE $2
    ORDER BY sp.last_synced_at DESC
    LIMIT 3
  `, [`%${title}%`, `%${productType}%`]);

  // 2. Create mappings with confidence scores
  for (const match of matches) {
    const confidence = calculateSimilarity(title, match.title);
    
    await db.query(`
      INSERT INTO shopify_product_mappings 
      (shopify_product_id, supplier_product_id, mapping_confidence, is_primary)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (shopify_product_id, supplier_product_id)
      DO UPDATE SET mapping_confidence = $3, updated_at = NOW()
    `, [shopifyProductId, match.id, confidence, confidence > 0.95]);
  }
}
```

### Near-Real-Time Sync: Supplier APIs → Backend

**Trigger:** Cron job every 4 hours + on-demand before product page render

**Flow:**
1. Cron triggers sync service
2. For each supplier, fetch product list via API
3. Store products in `supplier_products` table
4. Update `last_synced_at` timestamp

**Code (Node.js):**
```typescript
// apps/api/src/services/supplier/syncProducts.ts

async function syncSupplierProducts(supplierName: string) {
  const supplier = await db.query(
    `SELECT * FROM suppliers WHERE api_identifier = $1`,
    [supplierName]
  );

  const client = new SupplierClient(supplierName, supplier.api_key);
  const products = await client.listProducts({ limit: 500 });

  for (const product of products) {
    await db.query(`
      INSERT INTO supplier_products 
      (supplier_id, external_product_id, title, base_price, stock_status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (supplier_id, external_product_id)
      DO UPDATE SET 
        base_price = $4, 
        stock_status = $5,
        last_synced_at = NOW()
    `, [
      supplier.id,
      product.id,
      product.title,
      product.price,
      product.inStock ? 'in_stock' : 'out_of_stock'
    ]);
  }
}

// Schedule with node-cron or Bull queue
import cron from 'node-cron';
cron.schedule('0 */4 * * *', () => {
  Promise.all([
    syncSupplierProducts('autods'),
    syncSupplierProducts('spocket'),
    syncSupplierProducts('zendrop')
  ]);
});
```

### Order Sync: Order Created → Supplier

**Trigger:** Shopify webhook `orders/create`

**Flow:**
1. Shopify sends order webhook
2. Backend extracts line items + supplier selection
3. Backend calls supplier API to create order
4. Backend stores `supplier_order_id` for tracking

**Code:**
```typescript
// apps/api/src/services/shopify/orderCreation.ts

async function handleOrderCreated(shopifyOrder: ShopifyOrder) {
  const { id: shopifyOrderId, lineItems, customer } = shopifyOrder;

  for (const lineItem of lineItems) {
    const { properties } = lineItem;
    const supplierIdSelected = properties?.find(p => p.name === 'supplier_id')?.value;

    if (!supplierIdSelected) {
      // Default to cheapest supplier
      // ...
    }

    const supplier = await db.query(
      `SELECT * FROM suppliers WHERE id = $1`,
      [supplierIdSelected]
    );

    // Create order in supplier system
    const supplierOrder = await suppliers[supplier.name].createOrder({
      title: lineItem.title,
      quantity: lineItem.quantity,
      price: lineItem.price
    });

    // Store mapping
    await db.query(`
      INSERT INTO orders (shopify_order_id, selected_supplier_id, supplier_order_id, status)
      VALUES ($1, $2, $3, $4)
    `, [shopifyOrderId, supplier.id, supplierOrder.id, 'placed']);
  }
}
```

### Tracking Sync: Supplier → Customer

**Trigger:** Cron job every 2 hours for open orders

**Flow:**
1. Query all orders with status != 'delivered'
2. For each order, call supplier API for tracking
3. Update `shipments` table
4. Send customer email if status changed

**Code:**
```typescript
// apps/api/src/services/shopify/trackingSync.ts

async function syncAllTracking() {
  const openOrders = await db.query(`
    SELECT o.*, s.name as supplier_name
    FROM orders o
    JOIN suppliers s ON o.selected_supplier_id = s.id
    WHERE o.status NOT IN ('delivered', 'cancelled')
  `);

  for (const order of openOrders) {
    const tracking = await suppliers[order.supplier_name].getTracking(
      order.supplier_order_id
    );

    // Update shipment
    await db.query(`
      UPDATE shipments SET 
        status = $1,
        current_location = $2,
        last_updated = NOW()
      WHERE order_id = $3
    `, [tracking.status, tracking.location, order.id]);

    // Email customer if status changed
    if (tracking.status !== order.status) {
      await sendTrackingEmail(order.shopify_customer_id, tracking);
    }
  }
}
```

---

## Migration Script (PostgreSQL)

Save as `apps/api/src/db/migrations/001_initial_schema.sql`

Run with: `psql -U postgres -d shopaustralia -f migrations/001_initial_schema.sql`

Or use Prisma migrations (recommended for production).

---

## Caching Strategy

To avoid hitting supplier APIs on every product view:

```typescript
// apps/api/src/lib/cache.ts

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedComparisonOptions(shopifyProductId: string): Promise<SupplierOption[] | null> {
  const cached = await redis.get(`comparison:${shopifyProductId}`);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedComparisonOptions(shopifyProductId: string, options: SupplierOption[]) {
  // Cache for 30 minutes
  await redis.setex(
    `comparison:${shopifyProductId}`,
    1800,
    JSON.stringify(options)
  );
}

// Usage in comparison engine:
async function getComparisonOptions(shopifyProductId: string) {
  // Check cache first
  let options = await getCachedComparisonOptions(shopifyProductId);
  if (options) return options;

  // Otherwise compute and cache
  options = await computeComparisonOptions(shopifyProductId);
  await setCachedComparisonOptions(shopifyProductId, options);
  
  return options;
}
```

---

## Monitoring & Alerts

### Key metrics to track:
- Sync success rate (target: >99%)
- Time to sync (target: <5 minutes)
- Cache hit rate (target: >80%)
- Supplier API latency (target: <1s per call)
- Order placement success rate (target: >99.5%)

### Alert thresholds:
- Sync fails >3x consecutively → Page ops team
- Supplier API down >10 min → Escalate to supplier contact
- Order placement fails >5% → Halt auto-routing, manual review

---

**Questions? Check docs/DATABASE.md for advanced topics like partitioning, archival, and disaster recovery.**
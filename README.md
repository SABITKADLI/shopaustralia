# ShopAustralia - Smart Dropshipping Comparison Engine

A production-grade full-stack e-commerce application that enables customers to compare suppliers in real-time.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- pnpm (`npm install -g pnpm`)

### Setup

```bash
# 1. Clone
git clone https://github.com/SABITKADLI/shopaustralia.git
cd shopaustralia

# 2. Install
pnpm install

# 3. Start services
docker-compose up -d

# 4. Verify
docker-compose ps

# 5. Set environment variables
cp apps/storefront/.env.example apps/storefront/.env.local
cp apps/api/.env.example apps/api/.env
# Edit the .env files with your credentials

# 6. Run
cd apps/api && pnpm dev      # Terminal 1
cd apps/storefront && pnpm dev # Terminal 2

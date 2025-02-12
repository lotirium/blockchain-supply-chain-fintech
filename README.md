# Shipment Project

## 1. Database Setup (First Time)

```bash
# Navigate to server/scripts and create database
cd server/scripts
sudo -u postgres psql -f setup-db.sql
```

## 2. Reset Database (If Needed)

⚠️ **WARNING: This will permanently delete all data! Backup first if needed.**

```bash
cd server/scripts
sudo -u postgres psql -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'shipment_db' AND pid <> pg_backend_pid();"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS shipment_db;"
sudo -u postgres psql -c "DROP USER IF EXISTS shipment_user;"
sudo -u postgres psql -f setup-db.sql
node create-admin.mjs
```

## 3. Install Dependencies

```bash
cd blockchain && npm install
cd ../server && npm install
cd ../web && npm install
cd ../image-service && source venv/bin/activate && pip install -r requirements.txt
```

## 4. Normal Run (On 4 Terminals)

### Terminal 1: Start Blockchain

```bash
cd blockchain
npx hardhat node
```

### Terminal 2: Server

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
cd ../server
npm run dev
```

### Terminal 3: Hologram Server

```bash
cd image-service
source venv/bin/activate
uvicorn src.main:app --reload --port 5001
```

### Terminal 4: Frontend

```bash
cd web
npm run dev
```

## Environment Setup

Required environment variables in `.env` files:

### Server (.env)
```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=shipment_db
DB_USER=shipment_user
DB_PASSWORD=shipment_password_123
JWT_SECRET=your_jwt_secret
PORT=3001
```

### Web (.env)
```
VITE_API_URL=http://localhost:3001
VITE_PRODUCT_NFT_ADDRESS=<address from blockchain deployment>
VITE_SUPPLY_CHAIN_ADDRESS=<address from blockchain deployment>
```

## Database Schema

The database includes the following tables:

1. users
   - Primary key: id (UUID)
   - Unique constraint on email
   - Referenced by: stores, orders, notifications

2. stores
   - Primary key: id (UUID)
   - Foreign key: user_id → users(id)
   - Referenced by: products
   - Status types: pending, pending_verification, active, suspended
   - Store types: manufacturer, retailer

3. products
   - Primary key: id (UUID)
   - Foreign keys:
     * store_id → stores(id)
     * user_id → users(id)
   - Status types: draft, active, inactive, sold_out

4. orders
   - Primary key: id (UUID)
   - Foreign keys:
     * user_id → users(id)
     * store_id → stores(id)
   - Status types: pending, confirmed, packed, shipped, delivered, cancelled, refunded
   - Payment methods: crypto, fiat
   - Payment status: pending, completed, failed, refunded

5. notifications
   - Primary key: id (UUID)
   - Foreign key: user_id → users(id)
   - Types: info, success, warning, error

## Smart Contracts

Located in `blockchain/contracts/`:
- ProductNFT.sol: NFT contract for product tokenization
- SupplyChain.sol: Main supply chain management contract

## Additional Notes

- Make sure PostgreSQL is running before database operations
- Ensure correct contract addresses are copied to environment files after deployment
- MetaMask should be connected to Hardhat Network (chainId: 31337)
- Default ports:
  * Hardhat Network: 8545
  * PostgreSQL: 5432
  * Server: 3001
  * Web Frontend: 5173
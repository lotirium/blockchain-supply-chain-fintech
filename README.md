# Shipment Project

This project consists of four main components:
- Blockchain (Hardhat)
- Database (PostgreSQL)
- Server (Node.js)
- Web Frontend (React)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Git
- MetaMask browser extension
- npm or yarn

## First Time Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd shipment_project
```

### 2. Blockchain Setup

```bash
# Navigate to blockchain directory
cd blockchain

# Install dependencies
npm install

# Set up local Hardhat network
npx hardhat node

# In a new terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Important: Copy the deployed contract addresses
# You'll need to add these to your server and web .env files
```

### 3. Database Setup

```bash
# Ensure PostgreSQL is installed and running
sudo systemctl status postgresql

# Navigate to server/scripts directory
cd server/scripts

# Create database and tables
sudo -u postgres psql -f setup-db.sql
```

### 4. Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Set up environment variables (copy from example and modify as needed)
cp .env.example .env

# Required environment variables:
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=shipment_db
DB_USER=shipment_user
DB_PASSWORD=shipment_password_123
PRODUCT_NFT_ADDRESS=<address from blockchain deployment>
SUPPLY_CHAIN_ADDRESS=<address from blockchain deployment>
JWT_SECRET=your_jwt_secret
PORT=3000

# Start the server
npm run dev
```

### 5. Web Frontend Setup

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Set up environment variables (copy from example and modify as needed)
cp .env.example .env

# Required environment variables:
VITE_API_URL=http://localhost:3000
VITE_PRODUCT_NFT_ADDRESS=<address from blockchain deployment>
VITE_SUPPLY_CHAIN_ADDRESS=<address from blockchain deployment>

# Start the development server
npm run dev
```

## Subsequent Runs

### 1. Blockchain

```bash
# Start local Hardhat network
cd blockchain
npx hardhat node

# In a new terminal, deploy contracts if needed
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Database Reset (if needed)

⚠️ **WARNING: This will delete all data! Backup first if needed.**

```bash
# Navigate to server/scripts
cd server/scripts

# Kill existing connections and reset database
sudo -u postgres psql -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'shipment_db' AND pid <> pg_backend_pid();"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS shipment_db;"
sudo -u postgres psql -c "DROP USER IF EXISTS shipment_user;"
sudo -u postgres psql -f setup-db.sql
```

### 3. Server

```bash
cd server
npm run dev
```

### 4. Web Frontend

```bash
cd web
npm run dev
```

## Database Schema

The database includes the following tables (all lowercase):

1. users
   - Primary key: id
   - Unique constraint on email
   - Referenced by: stores, orders, notifications

2. categories
   - Primary key: id
   - Referenced by: products

3. stores
   - Primary key: id
   - Foreign key: user_id → users(id)
   - Referenced by: products

4. products
   - Primary key: id
   - Foreign keys: 
     * store_id → stores(id)
     * category_id → categories(id)
   - Referenced by: orders

5. orders
   - Primary key: id
   - Foreign keys:
     * user_id → users(id)
     * product_id → products(id)

6. notifications
   - Primary key: id
   - Foreign key: user_id → users(id)

## Smart Contracts

Located in `blockchain/contracts/`:
- ProductNFT.sol: NFT contract for product tokenization
- SupplyChain.sol: Main supply chain management contract

## MetaMask Setup

1. Install MetaMask browser extension
2. Add Hardhat Network:
   - Network Name: Hardhat
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

3. Import test accounts:
   - Copy private keys from Hardhat network output
   - Import into MetaMask using "Import Account"

## Port Configuration

- Hardhat Network: 8545
- PostgreSQL: 5432
- Server: 3000
- Web Frontend: 5173

## Troubleshooting

### Blockchain Issues

1. If Hardhat network fails to start:
   ```bash
   # Clear Hardhat cache
   cd blockchain
   rm -rf cache
   rm -rf artifacts
   ```

2. If contract deployment fails:
   ```bash
   # Ensure Hardhat network is running
   # Check if you're using the correct network in hardhat.config.js
   ```

### Database Issues

1. If you get permission errors:
   ```bash
   # Make sure you're running as postgres superuser
   sudo -u postgres psql -f setup-db.sql
   ```

2. If PostgreSQL is not running:
   ```bash
   sudo systemctl start postgresql
   ```

### Server Issues

1. If server fails to start:
   - Check if PostgreSQL is running
   - Verify .env configuration
   - Ensure required ports are not in use

2. If database connection fails:
   - Verify database credentials in .env
   - Check if database and user exist
   - Ensure PostgreSQL is running and accessible

### Web Frontend Issues

1. If development server fails to start:
   - Check if required ports are available
   - Verify environment variables
   - Ensure all dependencies are installed

2. If connecting to server fails:
   - Verify API endpoint in environment variables
   - Check if server is running
   - Check browser console for CORS errors

## Development Workflow

1. Start blockchain network first
2. Ensure database is running
3. Start the server
4. Start the web frontend
5. Use MetaMask with localhost network (chainId: 31337)

Remember to:
- Always have your .env files properly configured in both server and web directories
- Keep MetaMask connected to the Hardhat network
- Copy contract addresses after deployment
- Make sure all ports are available (8545, 5432, 3000, 5173)
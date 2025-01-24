# Shipment Project

A full-stack blockchain-based e-commerce platform with NFT integration.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js >= 18.0.0
- PostgreSQL >= 13
- Git
- MetaMask browser extension

## Installation

Clone the repository and follow the setup instructions for each component:

```bash
git clone https://github.com/yourusername/shipment_project.git
cd shipment_project
```

### 1. Database Setup

First, set up PostgreSQL database:

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE shipment_db;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE shipment_db TO postgres;
\q
```

### 2. Blockchain Setup

```bash
# Navigate to blockchain directory
cd blockchain

# Install dependencies
npm install

# Start local blockchain node (keep this terminal running)
npx hardhat node

# In a new terminal, deploy contracts
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Save the deployed contract addresses for later use in environment variables.

### 3. Backend Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Update `.env` with your configuration:
```env
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=shipment_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# CORS Configuration
CORS_ORIGIN=http://127.0.0.1:3000

# Blockchain Configuration
ETHEREUM_NODE_URL=http://127.0.0.1:8545
PRODUCT_NFT_ADDRESS=<your-deployed-nft-contract-address>
SUPPLY_CHAIN_ADDRESS=<your-deployed-supply-chain-address>
```

Then run migrations and start the server:
```bash
# Run database migrations
npx sequelize-cli db:migrate

# Start development server
npm run dev
```

### 4. Frontend Setup

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Update `.env` with your configuration:
```env
VITE_API_URL=http://localhost:3001
VITE_BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=<your-deployed-contract-address>
```

Start the frontend:
```bash
npm run dev
```

## Running the Application

1. Start services in this order:

```bash
# Terminal 1 - Start blockchain
cd blockchain
npx hardhat node

# Terminal 2 - Deploy contracts (only needed once or after blockchain restart)
cd blockchain
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 - Start backend server
cd server
npm run dev

# Terminal 4 - Start frontend
cd web
npm run dev
```

2. Configure MetaMask:
   - Network Name: Localhost
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Blockchain RPC: http://127.0.0.1:8545

## Troubleshooting

### Database Connection Issues
If you see "ConnectionRefusedError":
1. Verify PostgreSQL is running:
```bash
sudo service postgresql status
```
2. Check database exists:
```bash
psql -U postgres -l
```
3. Verify .env configuration matches your PostgreSQL setup

### Blockchain Issues
If contracts aren't working:
1. Ensure Hardhat node is running
2. Verify contract deployment was successful
3. Check contract addresses in .env files match deployed addresses
4. Make sure MetaMask is connected to localhost:8545 (Chain ID: 31337)

## Development Workflow

1. Always start services in order:
   - PostgreSQL database
   - Hardhat node
   - Backend server
   - Frontend development server
2. After making contract changes:
   - Recompile: `npx hardhat compile`
   - Redeploy: `npx hardhat run scripts/deploy.js --network localhost`
   - Update contract addresses in .env files
3. After database schema changes:
   - Run migrations: `npx sequelize-cli db:migrate`

## Testing

### Blockchain Tests
```bash
cd blockchain
npx hardhat test
```

### Backend Tests
```bash
cd server
npm test
```

## Additional Information

- The blockchain component uses Hardhat for development and testing
- The backend uses Sequelize as ORM with PostgreSQL
- The frontend is built with React, Redux Toolkit, and TailwindCSS
- IPFS integration is handled through Helia for decentralized storage
- Smart contracts are written in Solidity and use OpenZeppelin contracts
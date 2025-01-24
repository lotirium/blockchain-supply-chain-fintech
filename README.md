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
git clone <repository-url>
cd shipment_project
```

### 1. Blockchain Setup

```bash
# Navigate to blockchain directory
cd blockchain

# Install dependencies
npm install

# Compile smart contracts
npm run compile

# Run local blockchain node
npm run node

# In a new terminal, deploy contracts to local network
npm run deploy:local
```

### 2. Backend Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file (copy from example)
cp .env.example .env

# Update .env with your configuration
# Required variables:
# - DATABASE_URL=postgresql://user:password@localhost:5432/dbname
# - JWT_SECRET=your_jwt_secret
# - BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545

# Run database migrations
npx sequelize-cli db:migrate

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Create .env file (copy from example)
cp .env.example .env

# Update .env with your configuration
# Required variables:
# - VITE_API_URL=http://localhost:3000
# - VITE_BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545

# Start development server
npm run dev
```

## Environment Variables

### Blockchain (.env)
```
HARDHAT_NETWORK=localhost
PRIVATE_KEY=your_private_key_here
```

### Backend Server (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your_jwt_secret
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=deployed_contract_address
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=deployed_contract_address
```

## Running the Application

1. Start the local blockchain:
```bash
cd blockchain
npm run node
```

2. In a new terminal, start the backend server:
```bash
cd server
npm run dev
```

3. In another terminal, start the frontend:
```bash
cd web
npm run dev
```

4. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Blockchain RPC: http://127.0.0.1:8545

## Development Workflow

1. Ensure the local blockchain node is running
2. Deploy smart contracts if needed: `cd blockchain && npm run deploy:local`
3. Start the backend server in development mode
4. Start the frontend development server
5. Connect MetaMask to localhost:8545 network

## Testing

### Blockchain Tests
```bash
cd blockchain
npm test
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
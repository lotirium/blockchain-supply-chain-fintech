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

## Database Access

### PostgreSQL Setup
1. Install PostgreSQL if not already installed
2. Create database and user:
```bash
# Login to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE shipment_db;
CREATE USER shipment_user WITH ENCRYPTED PASSWORD 'shipment_password_123';
GRANT ALL PRIVILEGES ON DATABASE shipment_db TO shipment_user;
```

### PostgreSQL CLI Access
```bash
# Connect to database
psql -h 127.0.0.1 -p 5432 -U shipment_user -d shipment_db

# Common PostgreSQL commands:
\l                    # List all databases
\c shipment_db       # Connect to shipment_db
\dt                  # List all tables
\d table_name        # Describe table structure
```

### Database Management
1. Install a database management tool (recommended: pgAdmin or DBeaver)
2. Connect using these credentials:
   - Host: 127.0.0.1
   - Port: 5432
   - Database: shipment_db
   - Username: shipment_user
   - Password: shipment_password_123

### Database Operations
```bash
# Navigate to server directory
cd server

# Run database migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Create a new migration
npx sequelize-cli migration:generate --name migration-name

# Seed database with sample data (if available)
npx sequelize-cli db:seed:all
```

## Git Workflow

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd shipment_project

# Set up remote (if not already set)
git remote add origin <repository-url>
```

### Daily Development Workflow
```bash
# Get latest changes
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Check status of your changes
git status

# Stage changes
git add .                    # Stage all changes
git add specific-file.js     # Stage specific file

# Commit changes (follow conventional commits)
git commit -m "feat: add new product listing feature"
git commit -m "fix: resolve cart calculation issue"

# Push your changes
git push origin feature/your-feature-name

# Create pull request on GitHub/GitLab
# After review and approval, merge to main
```

### Common Git Operations
```bash
# Update feature branch with main
git checkout main
git pull origin main
git checkout feature/your-branch
git merge main

# Discard local changes
git checkout -- file-name    # Discard specific file
git checkout -- .           # Discard all changes

# Temporarily store changes
git stash
git stash pop              # Restore stashed changes

# View commit history
git log --oneline --graph
```

### Git Best Practices
1. Pull latest changes before starting new work
2. Create feature branches for new development
3. Follow conventional commits:
   - feat: new feature
   - fix: bug fix
   - docs: documentation changes
   - style: formatting
   - refactor: code restructuring
   - test: adding tests
   - chore: maintenance

## Additional Information

- The blockchain component uses Hardhat for development and testing
- The backend uses Sequelize as ORM with PostgreSQL
- The frontend is built with React, Redux Toolkit, and TailwindCSS
- IPFS integration is handled through Helia for decentralized storage
- Smart contracts are written in Solidity and use OpenZeppelin contracts
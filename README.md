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

```bash mac
cd server/scripts
psql -d shipment_db -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'shipment_db' AND pid <> pg_backend_pid();"
psql -d postgres -c "DROP DATABASE IF EXISTS shipment_db;"
psql -d postgres -c "DROP USER IF EXISTS shipment_user;"
psql -d postgres -f setup-db.sql
node create-admin.mjs
```

## 3. Install Dependencies

```bash
cd blockchain && npm install
cd ../server && npm install
cd ../web && npm install
cd ../image-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 4. Normal Run (On 4 Terminals)

### Terminal 1: Start Blockchain

```bash
cd blockchain
npx hardhat node --hostname 192.168.0.4 --port 8545

cd blockchain && npx hardhat run scripts/deploy.js --network local
```

### Terminal 2: Server

```bash
cd server
npm run dev
```

### Terminal 3: Hologram Server

```bash
cd image-service
source venv/bin/activate
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
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

## Changing IP Addresses (For Non-Technical Users)

This guide will help you change the connection settings to run the system on your network. Follow these steps carefully.

### Finding Your Computer's IP Address

#### On Windows:
1. Press `Windows Key + R`
2. Type `cmd` and press Enter
3. In the black window that opens, type: `ipconfig`
4. Look for "IPv4 Address" under "Wireless LAN adapter Wi-Fi" or "Ethernet adapter"
   - It will look something like: `192.168.1.100`
   - Write this number down, you'll need it!

#### On Mac:
1. Click the Apple menu and select "System Settings"
2. Click "Network"
3. Select your active connection (Wi-Fi or Ethernet)
4. Click "Details..."
5. Look for "IP Address"
   - It will look something like: `192.168.1.100`
   - Write this number down, you'll need it!

### Setting Up Each Component

Follow these steps in order. Replace `192.168.1.100` with your computer's IP address that you found above.
j
#### 1. Android App Setup:

1. Go to the `android/app` folder
2. Copy `debug.properties.example` to a new file named `debug.properties`:
   ```bash
   # On Windows (in Command Prompt):
   copy debug.properties.example debug.properties

   # On Mac (in Terminal):
   cp debug.properties.example debug.properties
   ```
3. Open `debug.properties` in a text editor (like Notepad or TextEdit)
4. Replace all instances of `127.0.0.1` with your computer's IP address
5. Save the file

#### 2. Web Frontend Setup:

1. Go to the `web` folder
2. Copy `.env.example` to a new file named `.env`:
   ```bash
   # On Windows:
   copy .env.example .env

   # On Mac:
   cp .env.example .env
   ```
3. Open `.env` in a text editor
4. Change these lines:
   ```
   VITE_API_HOST=your.ip.address.here    # Example: 192.168.1.100
   VITE_API_PORT=3001
   ```
5. Save the file

#### 3. Server Setup:

1. Go to the `server` folder
2. Copy `.env.example` to `.env`:
   ```bash
   # On Windows:
   copy .env.example .env

   # On Mac:
   cp .env.example .env
   ```
3. Open `.env` in a text editor
4. Add your computer's IP to CORS_ALLOWED_ORIGINS:
   ```
   CORS_ALLOWED_ORIGINS=http://192.168.1.100:3000,http://localhost:3000
   ```
5. Save the file

### Testing Your Setup

1. **Same Computer Testing:**
   - When running everything on the same computer, you can use:
     * `localhost` or `127.0.0.1` in the web browser
     * Your IP address (e.g., `192.168.1.100`) in the Android app

2. **Android Testing:**
   - **Using Emulator:**
     * Keep `127.0.0.1` in the settings (it automatically converts to `10.0.2.2`)
   - **Using Real Phone:**
     * Your computer's IP address (e.g., `192.168.1.100`)
     * Make sure your phone is connected to the same Wi-Fi network!

3. **Common Issues:**
   - Can't connect from phone?
     * Check if your phone is on the same Wi-Fi network
     * Make sure your computer's firewall allows connections
     * Try opening a browser on your phone and visit `http://your.ip.address:3001`

4. **Security Note:**
   - These instructions are for development only
   - For real deployment, use proper domain names and HTTPS

### Android App

1. Development Environment:
   ```properties
   # Copy android/app/debug.properties.example to android/app/debug.properties and edit:
   api.host=192.168.1.100     # Your development machine's IP
   api.port=3001
   api.protocol=http
   ws.protocol=ws
   
   ethereum.host=192.168.1.100
   ethereum.port=8545
   ethereum.protocol=http
   
   network.explorer.host=192.168.1.100
   network.explorer.port=4000
   network.explorer.protocol=http
   ```
   Note: When using Android Emulator, `127.0.0.1` or `localhost` will automatically be converted to `10.0.2.2`

2. Production Environment:
   ```properties
   # Copy android/app/release.properties.example to android/app/release.properties and edit:
   api.host=api.yourcompany.com
   api.port=443
   api.protocol=https
   ws.protocol=wss
   # ... other settings
   ```

### Web Frontend

Edit `web/.env`:
```bash
# Development
VITE_API_HOST=192.168.1.100
VITE_API_PORT=3001
VITE_API_PROTOCOL=http
VITE_WS_PROTOCOL=ws

# Production
VITE_API_HOST=api.yourcompany.com
VITE_API_PORT=443
VITE_API_PROTOCOL=https
VITE_WS_PROTOCOL=wss
```

### Server

Edit `server/.env`:
```bash
# Development
HOST=0.0.0.0           # Listen on all interfaces
PORT=3001
DB_HOST=127.0.0.1      # Database host
CORS_ALLOWED_ORIGINS=http://192.168.1.100:3000,http://localhost:3000

# Production
HOST=0.0.0.0
PORT=3001
DB_HOST=your-db-host
CORS_ALLOWED_ORIGINS=https://yourcompany.com
```

### Testing Different Environments

1. Local Development:
   - Use `127.0.0.1` or `localhost` for same-machine development
   - Android emulator automatically converts to `10.0.2.2`
   - Physical devices need your machine's local IP (e.g., `192.168.1.100`)

2. Local Network Testing:
   - Use your machine's local IP (e.g., `192.168.1.100`)
   - Update all environment files accordingly
   - Ensure firewall allows required ports

3. Production:
   - Use your domain names (e.g., `api.yourcompany.com`)
   - Always use HTTPS/WSS in production
   - Update SSL certificates accordingly

## Additional Notes

- Make sure PostgreSQL is running before database operations
- Ensure correct contract addresses are copied to environment files after deployment
- MetaMask should be connected to Hardhat Network (chainId: 31337)
- Default ports:
  * Hardhat Network: 8545
  * PostgreSQL: 5432
  * Server: 3001
  * Web Frontend: 5173
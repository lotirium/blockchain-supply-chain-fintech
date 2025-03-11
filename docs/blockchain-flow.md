# Complete Blockchain System Flow

## 1. Seller Registration Process

💻 Initial Request:
- Seller fills registration form
- Provides store details
- Submits for verification

➡️ System Processing:
- Validates seller information
- Checks store eligibility
- Prepares blockchain setup

🔑 Wallet Creation:
- Generates Ethereum wallet
- Creates private/public key pair
- Assigns unique address
- Funds with initial ETH (0.1 ETH)

⚙️ Smart Contract Setup:
- Grants RETAILER_ROLE
- Links wallet to store
- Enables product creation
- Activates permissions

## 2. Product Creation Process

💻 Seller Input:
- Product name
- Description
- Images
- Price
- Quantity
- Manufacturing details

📦 System Processing:
- Validates all data
- Processes images
- Generates unique IDs
- Prepares metadata

📄 IPFS Storage:
- Uploads all images
- Gets permanent links
- Creates metadata JSON:
  * Product details
  * Image links
  * Manufacturer info
  * Creation time
- Stores metadata on IPFS
- Gets metadata URI

## 3. NFT Minting Process

⚙️ Contract Preparation:
- Gets seller's wallet
- Prepares NFT data
- Calculates gas fees
- Signs transaction

📦 ProductNFT Contract:
- Generates token ID
- Creates NFT record:
  * Product name
  * Manufacturer
  * Creation date
  * IPFS URI
  * Owner address
- Mints new token
- Assigns to seller

## 4. Supply Chain Initialization

📋 SupplyChain Contract:
- Creates product record
- Sets initial status:
  * Location: Manufacturing
  * Stage: Created
  * Owner: Seller
  * Timestamp
- Initializes history
- Emits creation event

## 5. Order Processing

💻 Buyer Order:
- Places order
- Pays for product
- System validates

📦 Order Processing:
- Creates order record
- Updates inventory
- Prepares shipping
- Triggers blockchain update

⚙️ Smart Contract Updates:
- Changes product status
- Records new owner
- Updates location
- Adds to history

## 6. Blockchain Transaction

📝 Transaction Creation:
- Prepares data package
- Signs with seller key
- Calculates gas
- Submits to network

🌐 Network Distribution:
- Sends to all nodes
- Each node receives
- Smart contracts trigger
- State changes prepare

✅ Validation Process:
- Nodes check data
- Verify signatures
- Confirm rules
- Reach consensus

⛓️ Chain Update:
- Adds new block
- Updates state
- Records changes
- Confirms transaction

## 7. QR Code System

📱 Code Generation:
- Creates unique code
- Includes:
  * Order ID
  * Product ID
  * NFT token ID
  * Verification code
  * Timestamp
- Links to blockchain

✅ Verification Ready:
- QR code active
- Blockchain updated
- History recorded
- Ready for scanning

## 8. Mobile Verification

📱 App Process:
- Scans QR code
- Extracts data
- Queries blockchain
- Gets NFT details

✅ Verification Display:
- Shows product info
- Confirms authenticity
- Displays history
- Shows timeline

## 9. Real-time Updates

🔄 WebSocket System:
- Monitors blockchain
- Catches events
- Updates mobile app
- Shows changes live

Each step creates permanent, verifiable records that track the product from creation through delivery, enabling complete supply chain visibility and product authentication.
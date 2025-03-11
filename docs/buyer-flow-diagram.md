# Product Verification Flow

1. Product NFT Creation:
📄 When seller adds new product:
- Product details stored in database
- Images uploaded to IPFS
- NFT metadata created with IPFS URI
- ProductNFT contract mints new token
- Token assigned to seller's wallet
- Initial status set to "Created"

2. Supply Chain Tracking:
📄 SupplyChain contract tracks:
- Product creation
- Manufacturing status
- Transit stages
- Current location
- Ownership changes
- Complete timeline

3. Order Processing:
📄 When order is confirmed:
- Order status updated to "Processing"
- Product NFT status updated
- Supply chain stage updated
- Location information recorded

4. QR Code Generation:
📄 When order is packed:
- System generates unique verification code
- QR code created containing:
  * Order ID
  * Product ID
  * NFT Token ID
  * Verification code
  * Timestamp
- QR code status set to "active"
- QR data linked to order record

5. Product Delivery:
📄 Physical product includes:
- Printed QR code
- Product details
- Authenticity markers

6. Mobile App Verification:
📄 Buyer opens Android app
📄 Navigates to Orders section
📄 Selects delivered order
📄 Launches QR scanner
📄 App scans and decodes QR data

7. Verification Process:
📄 System checks:
- Order exists and is active
- QR code matches order data
- Verification code is valid
📄 Blockchain verification:
- Queries ProductNFT contract
- Retrieves token details
- Verifies ownership
- Gets manufacturing info
📄 Supply chain verification:
- Queries SupplyChain contract
- Gets complete product timeline
- Verifies all stages
- Confirms authenticity

8. Verification Results:
📄 App displays:
- Product authenticity status
- Manufacturing details
- Complete supply chain path
- All status changes
- Ownership history
- Location timeline

9. Post-Verification:
📄 System updates:
- Verification count increased
- Last verification time recorded
- Status history updated
- WebSocket notification sent

Each 📄 represents a step in the verification process
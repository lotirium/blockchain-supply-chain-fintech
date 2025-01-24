# Blockchain Infrastructure for E-commerce Platform

This directory contains the blockchain infrastructure for the e-commerce platform using Hyperledger Besu and Ethereum smart contracts. The system implements NFT-based product tracking and supply chain management.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Hyperledger Besu
- Git

## Project Structure

```
blockchain/
├── contracts/           # Smart contracts
│   ├── ProductNFT.sol   # NFT contract for product tracking
│   └── SupplyChain.sol  # Supply chain management contract
├── config/             # Network configuration
│   ├── genesis.json    # Genesis block configuration
│   └── config.toml     # Besu node configuration
├── scripts/            # Deployment and management scripts
│   ├── deploy.js       # Contract deployment script
│   └── init-network.sh # Network initialization script
└── test/              # Test files
    └── e2e-flow.test.js # End-to-end test scenarios
```

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Initialize the blockchain network:
```bash
./scripts/init-network.sh
```

3. Deploy smart contracts:
```bash
npm run deploy:local
```

4. Run tests:
```bash
npm test
```

## Network Setup

The blockchain network consists of three nodes running Hyperledger Besu with IBFT 2.0 consensus:

- Node 1 (Bootnode): http://127.0.0.1:8545
- Node 2: http://127.0.0.1:8546
- Node 3: http://127.0.0.1:8547

### Starting the Network

1. Ensure Hyperledger Besu is installed
2. Run the initialization script:
```bash
./scripts/init-network.sh
```
3. Wait for the network to stabilize (about 30 seconds)
4. Verify network status using the provided endpoints

## Smart Contracts

### ProductNFT Contract

The ProductNFT contract handles:
- Product tokenization using ERC721 standard
- Product metadata storage
- Ownership tracking
- Product status updates

### SupplyChain Contract

The SupplyChain contract manages:
- Role-based access control (Manufacturer, Distributor, Retailer)
- Product shipment tracking
- Supply chain stage updates
- Location tracking

## Development

### Local Development

1. Start the local network:
```bash
./scripts/init-network.sh
```

2. Deploy contracts:
```bash
npm run deploy:local
```

3. Run tests:
```bash
npm test
```

### Testing

The test suite includes:
- Unit tests for individual contracts
- Integration tests for contract interactions
- End-to-end flow tests simulating real usage scenarios

Run tests with:
```bash
npm test
```

For coverage report:
```bash
npm run coverage
```

## Integration with E-commerce Platform

### Web3 Integration

1. Install Web3 dependencies:
```bash
npm install web3 @truffle/contract
```

2. Connect to the blockchain:
```javascript
const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:8545');
```

3. Load contract artifacts:
```javascript
const ProductNFT = require('./artifacts/contracts/ProductNFT.sol/ProductNFT.json');
const SupplyChain = require('./artifacts/contracts/SupplyChain.sol/SupplyChain.json');
```

### Example Usage

```javascript
// Create new product
const createProduct = async (name, manufacturer, tokenURI) => {
  const productNFT = new web3.eth.Contract(ProductNFT.abi, PRODUCT_NFT_ADDRESS);
  await productNFT.methods.createProduct(
    recipient,
    name,
    manufacturer,
    tokenURI
  ).send({ from: manufacturerAddress });
};

// Track shipment
const trackShipment = async (productId) => {
  const supplyChain = new web3.eth.Contract(SupplyChain.abi, SUPPLY_CHAIN_ADDRESS);
  const shipment = await supplyChain.methods.getCurrentShipment(productId).call();
  return shipment;
};
```

## Security Considerations

1. Private Key Management
   - Secure storage of private keys
   - Use of environment variables for sensitive data
   - Regular key rotation

2. Access Control
   - Role-based access implementation
   - Proper permission management
   - Regular access audits

3. Smart Contract Security
   - Use of OpenZeppelin contracts
   - Regular security audits
   - Gas optimization

## Troubleshooting

### Common Issues

1. Network Connection Issues
   - Verify Besu is running
   - Check network endpoints
   - Ensure proper network configuration

2. Smart Contract Deployment Failures
   - Check gas settings
   - Verify account balances
   - Review deployment parameters

3. Transaction Errors
   - Check role permissions
   - Verify gas limits
   - Review transaction parameters

## Maintenance

### Regular Tasks

1. Network Monitoring
   - Check node status
   - Monitor peer connections
   - Review network performance

2. Contract Updates
   - Regular security patches
   - Feature updates
   - Gas optimization

3. Backup Procedures
   - Regular state backups
   - Configuration backups
   - Key backup and recovery procedures

## Support

For issues and support:
1. Check the troubleshooting guide
2. Review existing issues
3. Contact the development team

## License

MIT License - See LICENSE file for details
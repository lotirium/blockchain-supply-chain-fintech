#!/bin/bash

# Initialize Besu network for development

# Create necessary directories
mkdir -p data/besu/node1
mkdir -p data/besu/node2
mkdir -p data/besu/node3

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Besu network initialization...${NC}"

# Generate node keys
echo -e "${GREEN}Generating node keys...${NC}"
besu --data-path=data/besu/node1 public-key export --to=data/besu/node1/key.pub
besu --data-path=data/besu/node2 public-key export --to=data/besu/node2/key.pub
besu --data-path=data/besu/node3 public-key export --to=data/besu/node3/key.pub

# Start node 1 (bootnode)
echo -e "${GREEN}Starting bootnode (node1)...${NC}"
besu --data-path=data/besu/node1 \
    --genesis-file=config/genesis.json \
    --rpc-http-enabled \
    --rpc-http-api=ETH,NET,IBFT,WEB3,ADMIN \
    --host-allowlist="*" \
    --rpc-http-cors-origins="*" \
    --p2p-port=30303 \
    --rpc-http-port=8545 \
    --config-file=config/config.toml &

# Wait for bootnode to start
sleep 10

# Get bootnode enode URL
BOOTNODE_ENODE=$(besu --data-path=data/besu/node1 public-key export-address | tr -d '[:space:]')
BOOTNODE_ENODE="enode://$BOOTNODE_ENODE@127.0.0.1:30303"

# Start node 2
echo -e "${GREEN}Starting node 2...${NC}"
besu --data-path=data/besu/node2 \
    --genesis-file=config/genesis.json \
    --bootnodes=$BOOTNODE_ENODE \
    --p2p-port=30304 \
    --rpc-http-port=8546 \
    --config-file=config/config.toml &

# Start node 3
echo -e "${GREEN}Starting node 3...${NC}"
besu --data-path=data/besu/node3 \
    --genesis-file=config/genesis.json \
    --bootnodes=$BOOTNODE_ENODE \
    --p2p-port=30305 \
    --rpc-http-port=8547 \
    --config-file=config/config.toml &

echo -e "${BLUE}Waiting for network to stabilize...${NC}"
sleep 10

# Check if nodes are running and connected
echo -e "${GREEN}Checking network status...${NC}"
curl -X POST --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' 127.0.0.1:8545

echo -e "${BLUE}Network initialization completed!${NC}"
echo -e "${GREEN}The network is now ready for development.${NC}"
echo -e "Bootnode RPC: http://127.0.0.1:8545"
echo -e "Node 2 RPC: http://127.0.0.1:8546"
echo -e "Node 3 RPC: http://127.0.0.1:8547"

# Keep the script running
wait
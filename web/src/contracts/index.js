export { ProductNFTContract } from './productNFT';
export { SupplyChainContract } from './supplyChain';

// Contract deployment addresses
export const contractAddresses = {
  productNFT: import.meta.env.VITE_PRODUCT_NFT_ADDRESS,
  supplyChain: import.meta.env.VITE_SUPPLY_CHAIN_ADDRESS
};

// Contract constants
export const contractConstants = {
  stages: {
    CREATED: 0,
    IN_PRODUCTION: 1,
    MANUFACTURED: 2,
    IN_TRANSIT: 3,
    DELIVERED: 4,
    FOR_SALE: 5,
    SOLD: 6
  }
};
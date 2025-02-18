const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Deploy LogiCoin contract
  const LogiCoin = await ethers.getContractFactory("LogiCoin");
  console.log("Deploying LogiCoin...");
  const logiCoin = await LogiCoin.deploy();
  await logiCoin.deployed();
  console.log("LogiCoin deployed to:", logiCoin.address);

  // Deploy ProductNFT contract
  const ProductNFT = await ethers.getContractFactory("ProductNFT");
  console.log("Deploying ProductNFT...");
  const productNFT = await ProductNFT.deploy();
  await productNFT.deployed();
  console.log("ProductNFT deployed to:", productNFT.address);

  // Deploy SupplyChain contract with both dependencies
  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  console.log("Deploying SupplyChain...");
  const supplyChain = await SupplyChain.deploy(productNFT.address, logiCoin.address);
  await supplyChain.deployed();
  console.log("SupplyChain deployed to:", supplyChain.address);

  // Setup roles
  const [deployer] = await ethers.getSigners();
  
  // Verify roles on LogiCoin
  const MINTER_ROLE = await logiCoin.MINTER_ROLE();
  const DEFAULT_ADMIN_ROLE = await logiCoin.DEFAULT_ADMIN_ROLE();
  
  const hasLogiCoinAdminRole = await logiCoin.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  const hasLogiCoinMinterRole = await logiCoin.hasRole(MINTER_ROLE, deployer.address);
  
  if (!hasLogiCoinAdminRole || !hasLogiCoinMinterRole) {
    console.error("LogiCoin roles not properly set!");
    throw new Error("LogiCoin roles not granted to deployer");
  }
  console.log("Verified LogiCoin roles for deployer:", {
    admin: hasLogiCoinAdminRole,
    minter: hasLogiCoinMinterRole
  });

  // Setup SupplyChain roles
  const RETAILER_ROLE = await supplyChain.RETAILER_ROLE();
  await supplyChain.grantRole(RETAILER_ROLE, deployer.address);

  // Verify SupplyChain roles
  const hasRetailerRole = await supplyChain.isRetailer(deployer.address);
  const hasSupplyChainAdminRole = await supplyChain.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  
  console.log("Role verification for deployer on SupplyChain:", {
    address: deployer.address,
    admin: hasSupplyChainAdminRole,
    retailer: hasRetailerRole
  });

  if (!hasRetailerRole || !hasSupplyChainAdminRole) {
    throw new Error("Failed to grant SupplyChain roles to deployer");
  }

  // Transfer ownership of ProductNFT to SupplyChain contract
  await productNFT.transferOwnership(supplyChain.address);
  console.log("ProductNFT ownership transferred to SupplyChain contract");

  // Grant MINTER_ROLE to SupplyChain contract for LogiCoin
  await logiCoin.grantRole(MINTER_ROLE, supplyChain.address);
  console.log("Granted MINTER_ROLE to SupplyChain contract for LogiCoin");

  console.log("Deployment completed successfully!");
  
  // Return deployed contract addresses
  return {
    LogiCoin: logiCoin.address,
    ProductNFT: productNFT.address,
    SupplyChain: supplyChain.address,
    Deployer: deployer.address
  };
}

main()
  .then((deployedContracts) => {
    console.log("Deployed Contracts:", deployedContracts);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
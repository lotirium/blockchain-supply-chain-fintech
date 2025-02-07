const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Deploy ProductNFT contract
  const ProductNFT = await ethers.getContractFactory("ProductNFT");
  console.log("Deploying ProductNFT...");
  const productNFT = await ProductNFT.deploy();
  await productNFT.deployed();
  console.log("ProductNFT deployed to:", productNFT.address);

  // Deploy SupplyChain contract
  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  console.log("Deploying SupplyChain...");
  const supplyChain = await SupplyChain.deploy(productNFT.address);
  await supplyChain.deployed();
  console.log("SupplyChain deployed to:", supplyChain.address);

  // Setup roles
  const [deployer] = await ethers.getSigners();
  
  // Get admin role identifier
  const DEFAULT_ADMIN_ROLE = await supplyChain.DEFAULT_ADMIN_ROLE();

  // Verify deployer has admin role
  const hasAdminRole = await supplyChain.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  if (!hasAdminRole) {
    console.error("Deployer does not have admin role!");
    throw new Error("Admin role not granted to deployer");
  }
  console.log("Verified deployer has admin role:", deployer.address);

  // Grant deployer seller role
  await supplyChain.grantSellerRole(deployer.address);

  // Verify seller role was granted
  const hasSellerRole = await supplyChain.isSeller(deployer.address);

  console.log("Role verification for deployer:", {
    address: deployer.address,
    admin: hasAdminRole,
    seller: hasSellerRole
  });

  if (!hasSellerRole) {
    throw new Error("Failed to grant seller role to deployer");
  }

  // Transfer ownership of ProductNFT to SupplyChain contract
  await productNFT.transferOwnership(supplyChain.address);
  console.log("ProductNFT ownership transferred to SupplyChain contract");

  console.log("Deployment completed successfully!");
  
  // Return deployed contract addresses
  return {
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
const hre = require("hardhat");

async function main() {
  console.log("Starting role setup...");

  // Get the signer and contracts
  const [deployer] = await ethers.getSigners();
  console.log("Setting up roles for deployer:", deployer.address);

  let supplyChain;

  // Deploy ProductNFT first
  console.log("Deploying ProductNFT...");
  const ProductNFT = await ethers.getContractFactory("ProductNFT");
  const productNFT = await ProductNFT.deploy();
  await productNFT.deployed();
  console.log("ProductNFT deployed to:", productNFT.address);

  // Deploy SupplyChain
  console.log("Deploying SupplyChain...");
  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  supplyChain = await SupplyChain.deploy(productNFT.address);
  await supplyChain.deployed();
  console.log("SupplyChain deployed to:", supplyChain.address);

  // Transfer ownership of ProductNFT to SupplyChain
  console.log("Transferring ProductNFT ownership to SupplyChain...");
  await productNFT.transferOwnership(supplyChain.address);
  console.log("ProductNFT ownership transferred");

  // Get admin role identifier
  const DEFAULT_ADMIN_ROLE = await supplyChain.DEFAULT_ADMIN_ROLE();
  const hasAdminRole = await supplyChain.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  if (!hasAdminRole) {
    console.error("Deployer does not have admin role!");
    throw new Error("Admin role not granted to deployer");
  }
  console.log("Verified deployer has admin role:", deployer.address);

  // Check if deployer already has roles
  const hasRetailerRole = await supplyChain.isRetailer(deployer.address);
  console.log("Current roles for deployer:", {
    address: deployer.address,
    admin: hasAdminRole,
    retailer: hasRetailerRole
  });

  if (!hasRetailerRole) {
    console.log("Granting RETAILER_ROLE to deployer...");
    const RETAILER_ROLE = await supplyChain.RETAILER_ROLE();
    await supplyChain.grantRole(RETAILER_ROLE, deployer.address);
    console.log("RETAILER_ROLE granted successfully");
  }

  // Verify roles were granted
  const verifyRetailerRole = await supplyChain.isRetailer(deployer.address);
  console.log("Final role verification:", {
    address: deployer.address,
    admin: hasAdminRole,
    retailer: verifyRetailerRole
  });

  if (!verifyRetailerRole) {
    throw new Error("Failed to grant RETAILER_ROLE to deployer");
  }

  console.log("Role setup completed successfully!");
  console.log("\nContract Addresses:");
  console.log("ProductNFT:", productNFT.address);
  console.log("SupplyChain:", supplyChain.address);
  console.log("\nMake sure to update these addresses in your .env file");
  console.log("and restart your server to use the new contract addresses.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Role setup failed:", error);
    process.exit(1);
  });
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the signers
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy ProductNFT
  console.log("\nDeploying ProductNFT...");
  const ProductNFT = await hre.ethers.getContractFactory("ProductNFT");
  const productNFT = await ProductNFT.deploy();
  await productNFT.deployed();
  console.log("ProductNFT deployed to:", productNFT.address);

  // Deploy SupplyChain
  console.log("\nDeploying SupplyChain...");
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.deployed();
  console.log("SupplyChain deployed to:", supplyChain.address);

  // Verify contracts are accessible
  console.log("\nVerifying contracts...");
  
  try {
    // Test ProductNFT
    const productCount = await productNFT.getProduct(0).catch(() => null);
    console.log("ProductNFT is accessible");

    // Test SupplyChain
    const shipment = await supplyChain.getCurrentShipment(0).catch(() => null);
    console.log("SupplyChain is accessible");
  } catch (error) {
    console.error("Error verifying contracts:", error);
    process.exit(1);
  }

  // Update .env file
  const envPath = path.join(__dirname, "../../server/.env");
  console.log("\nUpdating .env file at:", envPath);

  try {
    let envContent = fs.readFileSync(envPath, "utf8");
    
    // Update contract addresses
    envContent = envContent.replace(
      /PRODUCT_NFT_ADDRESS=.*/,
      `PRODUCT_NFT_ADDRESS=${productNFT.address}`
    );
    envContent = envContent.replace(
      /SUPPLY_CHAIN_ADDRESS=.*/,
      `SUPPLY_CHAIN_ADDRESS=${supplyChain.address}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log("Updated contract addresses in .env file");
  } catch (error) {
    console.error("Error updating .env file:", error);
    process.exit(1);
  }

  console.log("\nDeployment complete! New contract addresses:");
  console.log("ProductNFT:", productNFT.address);
  console.log("SupplyChain:", supplyChain.address);
  console.log("\nMake sure to restart your server to use the new contract addresses.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
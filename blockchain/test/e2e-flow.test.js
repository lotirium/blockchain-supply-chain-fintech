const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("E-commerce Platform E2E Flow", function () {
  let ProductNFT;
  let SupplyChain;
  let productNFT;
  let supplyChain;
  let owner;
  let seller;
  let buyer;
  let distributor;

  // Test product details
  const productDetails = {
    name: "Test Product",
    manufacturer: "Test Manufacturer",
    tokenURI: "ipfs://QmTest123/metadata.json",
    price: ethers.utils.parseEther("1.0"),
    location: "Warehouse A"
  };

  beforeEach(async function () {
    // Get signers for different roles
    [owner, seller, buyer, distributor] = await ethers.getSigners();

    // Deploy ProductNFT contract
    ProductNFT = await ethers.getContractFactory("ProductNFT");
    productNFT = await ProductNFT.deploy();
    await productNFT.deployed();

    // Deploy SupplyChain contract
    SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy(productNFT.address);
    await supplyChain.deployed();

    // Transfer ownership of ProductNFT to SupplyChain
    await productNFT.transferOwnership(supplyChain.address);

    // Grant roles
    const MANUFACTURER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MANUFACTURER_ROLE"));
    const DISTRIBUTOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DISTRIBUTOR_ROLE"));
    const RETAILER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("RETAILER_ROLE"));

    await supplyChain.grantRole(MANUFACTURER_ROLE, seller.address);
    await supplyChain.grantRole(DISTRIBUTOR_ROLE, distributor.address);
    await supplyChain.grantRole(RETAILER_ROLE, buyer.address);
  });

  it("Should complete full e-commerce flow with NFT tracking", async function () {
    // Step 1: Seller creates a product listing (mints NFT)
    console.log("Step 1: Creating product listing...");
    const createProductTx = await productNFT.connect(seller).createProduct(
      seller.address,
      productDetails.name,
      productDetails.manufacturer,
      productDetails.tokenURI
    );
    const receipt = await createProductTx.wait();
    const event = receipt.events.find(e => e.event === 'ProductCreated');
    const tokenId = event.args.tokenId;
    
    expect(await productNFT.ownerOf(tokenId)).to.equal(seller.address);
    console.log(`Product NFT created with ID: ${tokenId}`);

    // Step 2: Create shipment when order is placed
    console.log("\nStep 2: Creating shipment for order...");
    await supplyChain.connect(seller).createShipment(
      tokenId,
      buyer.address,
      productDetails.location
    );

    const shipment = await supplyChain.getCurrentShipment(tokenId);
    expect(shipment.sender).to.equal(seller.address);
    expect(shipment.receiver).to.equal(buyer.address);
    console.log("Shipment created successfully");

    // Step 3: Update product status through supply chain
    console.log("\nStep 3: Updating product status...");
    await supplyChain.connect(seller).updateStage(tokenId, 1); // InProduction
    let stage = (await supplyChain.getCurrentShipment(tokenId)).stage;
    expect(stage).to.equal(1);
    console.log("Status updated to InProduction");

    await supplyChain.connect(seller).updateStage(tokenId, 2); // Manufactured
    stage = (await supplyChain.getCurrentShipment(tokenId)).stage;
    expect(stage).to.equal(2);
    console.log("Status updated to Manufactured");

    // Step 4: Update location during shipping
    console.log("\nStep 4: Updating product location...");
    await supplyChain.connect(distributor).updateLocation(
      tokenId,
      "Distribution Center B"
    );
    const updatedShipment = await supplyChain.getCurrentShipment(tokenId);
    expect(updatedShipment.location).to.equal("Distribution Center B");
    console.log("Location updated successfully");

    // Step 5: Transfer ownership to buyer
    console.log("\nStep 5: Transferring ownership to buyer...");
    await productNFT.connect(seller).transferFrom(
      seller.address,
      buyer.address,
      tokenId
    );
    expect(await productNFT.ownerOf(tokenId)).to.equal(buyer.address);
    console.log("Ownership transferred to buyer");

    // Step 6: Mark as delivered
    console.log("\nStep 6: Marking product as delivered...");
    await supplyChain.connect(distributor).updateStage(tokenId, 4); // Delivered
    stage = (await supplyChain.getCurrentShipment(tokenId)).stage;
    expect(stage).to.equal(4);
    console.log("Status updated to Delivered");

    // Step 7: Verify product information
    console.log("\nStep 7: Verifying product information...");
    const productInfo = await productNFT.getProduct(tokenId);
    expect(productInfo.name).to.equal(productDetails.name);
    expect(productInfo.manufacturer).to.equal(productDetails.manufacturer);
    expect(productInfo.currentOwner).to.equal(buyer.address);
    console.log("Product information verified successfully");

    // Step 8: Get complete shipment history
    console.log("\nStep 8: Retrieving shipment history...");
    const shipmentHistory = await supplyChain.getShipmentHistory(tokenId);
    expect(shipmentHistory.length).to.be.greaterThan(0);
    console.log(`Found ${shipmentHistory.length} shipment records`);
  });
});
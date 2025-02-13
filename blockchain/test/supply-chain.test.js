const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Supply Chain Full Test Suite", function () {
    let ProductNFT;
    let SupplyChain;
    let productNFT;
    let supplyChain;
    let owner;
    let seller;
    let buyer;

    // Test product details
    const productDetails = {
        name: "Test Product",
        seller: "Test Seller",
        tokenURI: "ipfs://QmTest123/metadata.json",
        price: ethers.utils.parseEther("1.0"),
        sellingPrice: ethers.utils.parseEther("2.0"),
        location: "Store A"
    };

    beforeEach(async function () {
        // Get signers for different roles
        [owner, seller, buyer] = await ethers.getSigners();

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
        const RETAILER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("RETAILER_ROLE"));
        await supplyChain.grantRole(RETAILER_ROLE, seller.address);
    });

    describe("Basic E2E Flow", function() {
        it("Should complete full e-commerce flow with NFT tracking", async function () {
            // Step 1: Create product
            console.log("Step 1: Creating product...");
            const tx = await supplyChain.connect(seller).createProduct(
                productDetails.name,
                productDetails.seller,
                productDetails.price,
                productDetails.tokenURI,
                productDetails.sellingPrice
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProductCreated');
            const productId = event.args.productId;
            console.log(`Product created with ID: ${productId}`);

            // Step 2: Create shipment
            console.log("\nStep 2: Creating shipment...");
            await supplyChain.connect(seller).createShipment(
                productId,
                buyer.address,
                productDetails.location
            );
            console.log("Shipment created");

            // Step 3: Update stages
            console.log("\nStep 3: Updating stages...");
            await supplyChain.connect(seller).updateStage(productId, 1); // InProduction
            await supplyChain.connect(seller).updateStage(productId, 2); // Manufactured
            console.log("Stages updated");

            // Step 4: Transfer ownership
            console.log("\nStep 4: Transferring ownership...");
            await productNFT.connect(seller).transferFrom(seller.address, buyer.address, productId);
            expect(await productNFT.ownerOf(productId)).to.equal(buyer.address);
            console.log("Ownership transferred");

            // Step 5: Mark delivered
            console.log("\nStep 5: Marking as delivered...");
            await supplyChain.connect(seller).updateStage(productId, 4); // Delivered
            console.log("Marked as delivered");
        });
    });

    describe("Payment and Escrow", function () {
        it("Should handle payment flow with escrow", async function () {
            // Create product
            const tx = await supplyChain.connect(seller).createProduct(
                productDetails.name,
                productDetails.seller,
                productDetails.price,
                productDetails.tokenURI,
                productDetails.sellingPrice
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProductCreated');
            const productId = event.args.productId;

            // Buyer pays
            await supplyChain.connect(buyer).payForProduct(productId, {
                value: productDetails.sellingPrice
            });

            // Check escrow
            expect(await supplyChain.escrowBalances(productId)).to.equal(productDetails.sellingPrice);

            // Release payment
            await supplyChain.connect(seller).releasePayment(productId);

            // Verify escrow is empty
            expect(await supplyChain.escrowBalances(productId)).to.equal(0);
        });
    });

    describe("Batch Processing", function () {
        it("Should handle batch operations", async function () {
            // Create batch
            const names = ["Product1", "Product2"];
            const prices = [
                ethers.utils.parseEther("1.0"),
                ethers.utils.parseEther("2.0")
            ];
            const tokenURIs = ["ipfs://test1", "ipfs://test2"];
            const sellingPrices = [
                ethers.utils.parseEther("2.0"),
                ethers.utils.parseEther("3.0")
            ];

            const tx = await supplyChain.connect(seller).createProductBatch(
                names,
                productDetails.seller,
                prices,
                tokenURIs,
                sellingPrices
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'BatchCreated');
            const batchId = event.args.batchId;
            
            // Verify batch
            const productIds = await supplyChain.getBatchProducts(batchId);
            expect(productIds.length).to.equal(2);

            // Create shipment for batch
            await supplyChain.connect(seller).createBatchShipment(
                batchId,
                buyer.address,
                productDetails.location
            );

            // Update batch stage
            await supplyChain.connect(seller).updateBatchStage(batchId, 2); // Manufactured

            // Verify all products updated
            for (const productId of productIds) {
                const shipment = await supplyChain.getCurrentShipment(productId);
                expect(shipment.stage).to.equal(2);
            }
        });
    });

    describe("Returns and Recalls", function () {
        let productId;

        beforeEach(async function () {
            // Create product
            const tx = await supplyChain.connect(seller).createProduct(
                productDetails.name,
                productDetails.seller,
                productDetails.price,
                productDetails.tokenURI,
                productDetails.sellingPrice
            );
            const receipt = await tx.wait();
            productId = receipt.events.find(e => e.event === 'ProductCreated').args.productId;

            // Transfer to buyer
            await productNFT.connect(seller).transferFrom(seller.address, buyer.address, productId);
        });

        it("Should handle returns", async function () {
            // Request return
            await supplyChain.connect(buyer).requestReturn(productId, "Defective item");

            // Check return request
            const returnRequest = await supplyChain.getReturnRequest(productId);
            expect(returnRequest.requestedBy).to.equal(buyer.address);
            expect(returnRequest.approved).to.be.false;

            // Approve return
            await supplyChain.connect(seller).approveReturn(productId);

            // Verify status
            const shipment = await supplyChain.getCurrentShipment(productId);
            expect(shipment.stage).to.equal(7); // Returned stage
        });

        it("Should handle recalls", async function () {
            // Recall product
            await supplyChain.connect(seller).recallProducts([productId], "Safety concern");

            // Verify recall
            const returnRequest = await supplyChain.getReturnRequest(productId);
            expect(returnRequest.isRecall).to.be.true;
            expect(returnRequest.approved).to.be.true;

            // Verify status
            const shipment = await supplyChain.getCurrentShipment(productId);
            expect(shipment.stage).to.equal(8); // Recalled stage

            // Verify blocked operations
            await expect(
                supplyChain.connect(seller).createShipment(productId, buyer.address, "Location X")
            ).to.be.revertedWith("Product has been recalled");
        });
    });
});
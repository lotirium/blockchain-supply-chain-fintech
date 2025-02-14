// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProductNFT.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SupplyChain is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    // Payment related state variables
    mapping(uint256 => uint256) public productPrices;
    mapping(uint256 => uint256) public escrowBalances;
    mapping(uint256 => address) public escrowBeneficiary;
    uint256 public escrowTimeout = 7 days;

    // Reference to the ProductNFT contract
    ProductNFT private productNFT;

    // Supply Chain stages
    enum Stage { Created, InProduction, InTransit, Delivered, ForSale, Sold, Returned, Recalled }

    struct ReturnRequest {
        address requestedBy;
        string reason;
        uint256 timestamp;
        bool approved;
        bool isRecall;
    }

    // Structure to store shipment information
    struct Shipment {
        uint256 productId;
        address sender;
        address receiver;
        Stage currentStage;
        uint256 timestamp;
        string location;
    }

    // Return and recall tracking
    mapping(uint256 => ReturnRequest) public returnRequests;

    // Batch tracking
    mapping(bytes32 => uint256[]) private batchProducts;

    // Mapping from product ID to its shipment history
    mapping(uint256 => Shipment[]) private shipmentHistory;

    event ShipmentCreated(uint256 indexed productId, address indexed sender, address indexed receiver);
    event StageUpdated(uint256 indexed productId, Stage newStage);
    event LocationUpdated(uint256 indexed productId, string newLocation);
    event ProductCreated(uint256 indexed productId, address indexed seller, string name, uint256 price);
    event PaymentReceived(uint256 indexed productId, address indexed payer, uint256 amount);
    event PaymentReleased(uint256 indexed productId, address indexed beneficiary, uint256 amount);
    event PaymentRefunded(uint256 indexed productId, address indexed receiver, uint256 amount);
    event EscrowClaimed(uint256 indexed productId, address indexed beneficiary, uint256 amount);
    event BatchCreated(bytes32 indexed batchId, uint256[] productIds);
    event BatchShipmentCreated(bytes32 indexed batchId, address indexed sender, address indexed receiver);
    event BatchStageUpdated(bytes32 indexed batchId, Stage newStage);
    event ReturnRequested(uint256 indexed productId, address indexed requestedBy, string reason);
    event ReturnApproved(uint256 indexed productId, address indexed approvedBy);
    event ReturnRejected(uint256 indexed productId, address indexed rejectedBy);
    event ProductRecalled(uint256 indexed productId, address indexed recalledBy, string reason);
    event RecallResolved(uint256 indexed productId, address indexed resolvedBy);

    constructor(address productNFTAddress) {
        productNFT = ProductNFT(productNFTAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Checks if an account has retailer role
     * @param account Address of the account to check
     * @return bool True if the account has retailer role
     */
    function isRetailer(address account) public view returns (bool) {
        return hasRole(RETAILER_ROLE, account);
    }

    /**
     * @dev Creates a new product and mints its NFT
     * @param name Product name
     * @param seller Seller name
     * @param tokenURI URI containing product metadata
     * @param sellingPrice The selling price for the product
     * @return productId The ID of the newly created product
     */
    function createProduct(
        string memory name,
        string memory seller,
        uint256 /*,  // Unused price parameter */,
        string memory tokenURI,
        uint256 sellingPrice
    ) public whenNotPaused returns (uint256) {
        require(
            hasRole(RETAILER_ROLE, msg.sender),
            "Caller must be retailer"
        );

        require(sellingPrice > 0, "Price must be greater than 0");

        // Create product through ProductNFT contract
        uint256 productId = productNFT.createProduct(
            msg.sender,
            name,
            seller,
            tokenURI
        );

        // Initialize supply chain tracking
        Shipment memory initialShipment = Shipment({
            productId: productId,
            sender: msg.sender,
            receiver: msg.sender, // Initially, sender and receiver are the same
            currentStage: Stage.Created,
            timestamp: block.timestamp,
            location: "Retail Facility" // Default initial location
        });
        
        productPrices[productId] = sellingPrice;

        shipmentHistory[productId].push(initialShipment);
        
        emit ProductCreated(productId, msg.sender, name, sellingPrice);
        emit StageUpdated(productId, Stage.ForSale);
        
        return productId;
    }

    /**
     * @dev Creates a new shipment for a product
     * @param productId The ID of the product NFT
     * @param receiver Address of the receiver
     * @param location Current location of the product
     */
    function createShipment(
        uint256 productId,
        address receiver,
        string memory location
    ) public whenNotPaused {
        require(
            hasRole(RETAILER_ROLE, msg.sender),
            "Caller must be retailer"
        );
        require(!returnRequests[productId].isRecall, "Product has been recalled");
        require(!returnRequests[productId].approved, "Product has pending return");

        Shipment memory newShipment = Shipment({
            productId: productId,
            sender: msg.sender,
            receiver: receiver,
            currentStage: Stage.InTransit,
            timestamp: block.timestamp,
            location: location
        });

        shipmentHistory[productId].push(newShipment);
        emit ShipmentCreated(productId, msg.sender, receiver);
    }

    /**
     * @dev Updates the stage of a product in the supply chain
     * @param productId The ID of the product NFT
     * @param newStage The new stage to set
     */
    function updateStage(uint256 productId, Stage newStage) public whenNotPaused {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(RETAILER_ROLE, msg.sender),
            "Unauthorized"
        );

        require(shipmentHistory[productId].length > 0, "No shipment found");
        
        Shipment[] storage history = shipmentHistory[productId];
        history[history.length - 1].currentStage = newStage;
        
        emit StageUpdated(productId, newStage);
    }

    /**
     * @dev Updates the location of a product
     * @param productId The ID of the product NFT
     * @param newLocation The new location
     */
    function updateLocation(uint256 productId, string memory newLocation) public whenNotPaused {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(RETAILER_ROLE, msg.sender),
            "Unauthorized"
        );

        require(shipmentHistory[productId].length > 0, "No shipment found");
        
        Shipment[] storage history = shipmentHistory[productId];
        history[history.length - 1].location = newLocation;
        
        emit LocationUpdated(productId, newLocation);
    }

    /**
     * @dev Gets the complete shipment history of a product
     * @param productId The ID of the product NFT
     */
    function getShipmentHistory(uint256 productId) public view returns (Shipment[] memory) {
        return shipmentHistory[productId];
    }

    /**
     * @dev Gets the current shipment status of a product
     * @param productId The ID of the product NFT
     */
    function getCurrentShipment(uint256 productId) public view returns (
        address sender,
        address receiver,
        Stage stage,
        uint256 timestamp,
        string memory location
    ) {
        require(shipmentHistory[productId].length > 0, "No shipment found");
        
        Shipment storage currentShipment = shipmentHistory[productId][shipmentHistory[productId].length - 1];
        return (
            currentShipment.sender,
            currentShipment.receiver,
            currentShipment.currentStage,
            currentShipment.timestamp,
            currentShipment.location
        );
    }

    /**
     * @dev Creates multiple products in a batch
     * @param names Array of product names
     * @param seller Seller name (same for all products in batch)
     * @param prices Array of product prices
     * @param tokenURIs Array of token URIs
     * @param sellingPrices Array of selling prices
     * @return batchId The ID of the created batch
     * @return productIds Array of created product IDs
     */
    function createProductBatch(
        string[] memory names,
        string memory seller,
        uint256[] memory prices,
        string[] memory tokenURIs,
        uint256[] memory sellingPrices
    ) public whenNotPaused returns (bytes32, uint256[] memory) {
        require(
            names.length == prices.length &&
            prices.length == tokenURIs.length &&
            tokenURIs.length == sellingPrices.length,
            "Array lengths must match"
        );

        uint256[] memory productIds = new uint256[](names.length);
        for(uint256 i = 0; i < names.length; i++) {
            productIds[i] = createProduct(
                names[i],
                seller,
                prices[i],
                tokenURIs[i],
                sellingPrices[i]
            );
        }

        bytes32 batchId = keccak256(abi.encodePacked(block.timestamp, msg.sender, productIds));
        batchProducts[batchId] = productIds;

        emit BatchCreated(batchId, productIds);
        return (batchId, productIds);
    }

    /**
     * @dev Creates a shipment for a batch of products
     * @param batchId The batch ID
     * @param receiver Address of the receiver
     * @param location Current location
     */
    function createBatchShipment(
        bytes32 batchId,
        address receiver,
        string memory location
    ) public whenNotPaused {
        require(batchProducts[batchId].length > 0, "Batch does not exist");
        
        uint256[] memory products = batchProducts[batchId];
        for(uint256 i = 0; i < products.length; i++) {
            createShipment(products[i], receiver, location);
        }

        emit BatchShipmentCreated(batchId, msg.sender, receiver);
    }

    /**
     * @dev Updates the stage for a batch of products
     * @param batchId The batch ID
     * @param newStage The new stage
     */
    function updateBatchStage(bytes32 batchId, Stage newStage) public whenNotPaused {
        require(batchProducts[batchId].length > 0, "Batch does not exist");
        
        uint256[] memory products = batchProducts[batchId];
        for(uint256 i = 0; i < products.length; i++) {
            updateStage(products[i], newStage);
        }

        emit BatchStageUpdated(batchId, newStage);
    }

    /**
     * @dev Gets all product IDs in a batch
     * @param batchId The batch ID
     * @return productIds Array of product IDs in the batch
     */
    function getBatchProducts(bytes32 batchId) public view returns (uint256[] memory) {
        require(batchProducts[batchId].length > 0, "Batch does not exist");
        return batchProducts[batchId];
    }

    /**
     * @dev Pay for a product, funds go to escrow
     * @param productId The ID of the product to pay for
     */
    function payForProduct(uint256 productId) public payable nonReentrant whenNotPaused {
        require(productPrices[productId] > 0, "Product not for sale");
        require(msg.value == productPrices[productId], "Incorrect payment amount");
        require(escrowBalances[productId] == 0, "Payment already in escrow");
        require(!returnRequests[productId].isRecall, "Product has been recalled");

        escrowBalances[productId] = msg.value;
        escrowBeneficiary[productId] = productNFT.ownerOf(productId);

        emit PaymentReceived(productId, msg.sender, msg.value);
    }

    /**
     * @dev Release payment from escrow to seller
     * @param productId The ID of the product
     */
    function releasePayment(uint256 productId) public nonReentrant whenNotPaused {
        require(msg.sender == productNFT.ownerOf(productId), "Only product owner can release payment");
        require(escrowBalances[productId] > 0, "No payment in escrow");
        require(!returnRequests[productId].isRecall, "Product has been recalled");

        uint256 amount = escrowBalances[productId];
        address payable beneficiary = payable(escrowBeneficiary[productId]);

        escrowBalances[productId] = 0;
        escrowBeneficiary[productId] = address(0);

        (bool success, ) = beneficiary.call{value: amount}("");
        require(success, "Payment release failed");

        emit PaymentReleased(productId, beneficiary, amount);
    }

    /**
     * @dev Refund payment from escrow to buyer
     * @param productId The ID of the product
     */
    function refundPayment(uint256 productId) public nonReentrant whenNotPaused {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            msg.sender == escrowBeneficiary[productId],
            "Not authorized to refund"
        );
        require(escrowBalances[productId] > 0, "No payment in escrow");

        uint256 amount = escrowBalances[productId];
        address buyer = productNFT.ownerOf(productId);

        escrowBalances[productId] = 0;
        escrowBeneficiary[productId] = address(0);

        (bool success, ) = payable(buyer).call{value: amount}("");
        require(success, "Refund failed");

        emit PaymentRefunded(productId, buyer, amount);
    }

    /**
     * @dev Claim payment from escrow after timeout
     * @param productId The ID of the product
     */
    function claimPayment(uint256 productId) public nonReentrant whenNotPaused {
        require(escrowBalances[productId] > 0, "No payment in escrow");
        require(msg.sender == escrowBeneficiary[productId], "Not the beneficiary");
        require(!returnRequests[productId].isRecall, "Product has been recalled");

        Shipment[] storage history = shipmentHistory[productId];
        require(
            history.length > 0 &&
            block.timestamp > history[history.length - 1].timestamp + escrowTimeout,
            "Escrow timeout not reached"
        );

        uint256 amount = escrowBalances[productId];
        escrowBalances[productId] = 0;
        escrowBeneficiary[productId] = address(0);

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Claim payment failed");

        emit EscrowClaimed(productId, msg.sender, amount);
    }

    /**
     * @dev Get product price
     * @param productId The ID of the product
     * @return price The price of the product
     */
    function getProductPrice(uint256 productId) public view returns (uint256) {
        return productPrices[productId];
    }

    /**
     * @dev Request a return for a product
     * @param productId The ID of the product
     * @param reason Reason for return
     */
    function requestReturn(
        uint256 productId,
        string memory reason
    ) public whenNotPaused {
        require(productNFT.ownerOf(productId) == msg.sender, "Not product owner");
        require(returnRequests[productId].timestamp == 0, "Return already requested");
        require(!returnRequests[productId].isRecall, "Product has been recalled");

        returnRequests[productId] = ReturnRequest({
            requestedBy: msg.sender,
            reason: reason,
            timestamp: block.timestamp,
            approved: false,
            isRecall: false
        });

        emit ReturnRequested(productId, msg.sender, reason);
    }

    /**
     * @dev Approve a return request
     * @param productId The ID of the product
     */
    function approveReturn(uint256 productId) public whenNotPaused {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(RETAILER_ROLE, msg.sender),
            "Only admin or retailer can approve returns"
        );
        require(returnRequests[productId].timestamp > 0, "No return requested");
        require(!returnRequests[productId].approved, "Return already approved");
        require(!returnRequests[productId].isRecall, "Cannot approve recall as return");

        returnRequests[productId].approved = true;
        
        // Update stage to Returned
        updateStage(productId, Stage.Returned);

        // If payment is in escrow, process refund
        if (escrowBalances[productId] > 0) {
            refundPayment(productId);
        }

        emit ReturnApproved(productId, msg.sender);
    }

    /**
     * @dev Reject a return request
     * @param productId The ID of the product
     */
    function rejectReturn(uint256 productId) public whenNotPaused {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            hasRole(RETAILER_ROLE, msg.sender),
            "Only admin or retailer can reject returns"
        );
        require(returnRequests[productId].timestamp > 0, "No return requested");
        require(!returnRequests[productId].approved, "Return already approved");
        require(!returnRequests[productId].isRecall, "Cannot reject recall as return");

        delete returnRequests[productId];
        emit ReturnRejected(productId, msg.sender);
    }

    /**
     * @dev Recall a product or batch of products
     * @param productIds Array of product IDs to recall
     * @param reason Reason for recall
     */
    function recallProducts(
        uint256[] memory productIds,
        string memory reason
    ) public whenNotPaused {
        require(
            hasRole(RETAILER_ROLE, msg.sender) ||
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Only admin or retailer can recall products"
        );

        for (uint256 i = 0; i < productIds.length; i++) {
            uint256 productId = productIds[i];
            
            // Create or update return request as recall
            returnRequests[productId] = ReturnRequest({
                requestedBy: msg.sender,
                reason: reason,
                timestamp: block.timestamp,
                approved: true, // Recalls are auto-approved
                isRecall: true
            });

            // Update stage to Recalled
            updateStage(productId, Stage.Recalled);

            // If payment is in escrow, process refund
            if (escrowBalances[productId] > 0) {
                refundPayment(productId);
            }

            emit ProductRecalled(productId, msg.sender, reason);
        }
    }

    /**
     * @dev Get return/recall request for a product
     * @param productId The ID of the product
     */
    function getReturnRequest(uint256 productId) public view returns (ReturnRequest memory) {
        return returnRequests[productId];
    }

    /**
     * @dev Resolve a product recall
     * @param productId The ID of the product
     */
    function resolveRecall(uint256 productId) public whenNotPaused {
        require(returnRequests[productId].timestamp > 0, "No recall exists");
        require(returnRequests[productId].isRecall, "Not a recall");
        delete returnRequests[productId];
        emit RecallResolved(productId, msg.sender);
    }

    receive() external payable {
        revert("Direct payments not accepted");
    }

    /**
     * @dev Pauses all contract operations
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all contract operations
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProductNFT.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SupplyChain is AccessControl, Pausable {
    // Role definitions
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    // Reference to the ProductNFT contract
    ProductNFT private productNFT;

    // Supply Chain stages
    enum Stage { Created, InProduction, Manufactured, InTransit, Delivered, ForSale, Sold }

    // Structure to store shipment information
    struct Shipment {
        uint256 productId;
        address sender;
        address receiver;
        Stage currentStage;
        uint256 timestamp;
        string location;
    }

    // Mapping from product ID to its shipment history
    mapping(uint256 => Shipment[]) private shipmentHistory;

    // Events
    event ShipmentCreated(uint256 indexed productId, address indexed sender, address indexed receiver);
    event StageUpdated(uint256 indexed productId, Stage newStage);
    event LocationUpdated(uint256 indexed productId, string newLocation);
    event ProductCreated(uint256 indexed productId, address indexed manufacturer, string name);

    constructor(address productNFTAddress) {
        productNFT = ProductNFT(productNFTAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Grants manufacturer role to an account
     * @param account Address of the account to grant the role to
     */
    function grantManufacturerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MANUFACTURER_ROLE, account);
    }

    /**
     * @dev Grants distributor role to an account
     * @param account Address of the account to grant the role to
     */
    function grantDistributorRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DISTRIBUTOR_ROLE, account);
    }

    /**
     * @dev Grants retailer role to an account
     * @param account Address of the account to grant the role to
     */
    function grantRetailerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(RETAILER_ROLE, account);
    }

    /**
     * @dev Checks if an account has manufacturer role
     * @param account Address of the account to check
     * @return bool True if the account has manufacturer role
     */
    function isManufacturer(address account) public view returns (bool) {
        return hasRole(MANUFACTURER_ROLE, account);
    }

    /**
     * @dev Checks if an account has distributor role
     * @param account Address of the account to check
     * @return bool True if the account has distributor role
     */
    function isDistributor(address account) public view returns (bool) {
        return hasRole(DISTRIBUTOR_ROLE, account);
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
     * @param manufacturer Manufacturer name
     * @param price Product price
     * @param tokenURI URI containing product metadata
     * @return productId The ID of the newly created product
     */
    function createProduct(
        string memory name,
        string memory manufacturer,
        uint256 price,
        string memory tokenURI
    ) public whenNotPaused returns (uint256) {
        require(
            hasRole(MANUFACTURER_ROLE, msg.sender) ||
            hasRole(RETAILER_ROLE, msg.sender),
            "Caller must be manufacturer or retailer"
        );

        // Create product through ProductNFT contract
        uint256 productId = productNFT.createProduct(
            msg.sender,
            name,
            manufacturer,
            tokenURI
        );

        // Initialize supply chain tracking
        Shipment memory initialShipment = Shipment({
            productId: productId,
            sender: msg.sender,
            receiver: msg.sender, // Initially, sender and receiver are the same
            currentStage: Stage.Created,
            timestamp: block.timestamp,
            location: "Manufacturing Facility" // Default initial location
        });

        shipmentHistory[productId].push(initialShipment);
        
        emit ProductCreated(productId, msg.sender, name);
        emit StageUpdated(productId, Stage.Created);
        
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
            hasRole(MANUFACTURER_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender),
            "Caller must be manufacturer or distributor"
        );

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
            hasRole(MANUFACTURER_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender) ||
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
            hasRole(MANUFACTURER_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender) ||
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
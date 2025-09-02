// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProductNFT.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SupplyChain is AccessControl, Pausable {
    // Role definitions
    bytes32 public constant SELLER_ROLE = keccak256("SELLER_ROLE");

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
    event ProductCreated(uint256 indexed tokenId, string name, address manufacturer);

    constructor(address productNFTAddress) {
        productNFT = ProductNFT(productNFTAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Grants seller role to an account
     * @param account Address of the account to grant the role to
     */
    function grantSellerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(SELLER_ROLE, account);
    }

    /**
     * @dev Checks if an account has seller role
     * @param account Address of the account to check
     * @return bool True if the account has seller role
     */
    function isSeller(address account) public view returns (bool) {
        return hasRole(SELLER_ROLE, account);
    }

    /**
     * @dev Creates a new product and mints its NFT
     * @param name Product name
     * @param manufacturer Manufacturer name
     * @param price Product price
     * @param tokenURI URI containing product metadata
     * @return productId The ID of the newly created product
     */
    /**
     * @dev Initializes minting rights for this contract
     */
    function initializeMinterRole() public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(productNFT) != address(0), "ProductNFT not initialized");
        productNFT.grantMinterRole(address(this));
    }

    /**
     * @dev Checks if this contract has minting rights
     */
    function checkMinterRole() public view returns (bool) {
        return productNFT.hasRole(productNFT.MINTER_ROLE(), address(this));
    }

    function createProduct(
        string memory name,
        string memory manufacturer,
        uint256 price,
        string memory tokenURI
    ) public whenNotPaused returns (uint256) {
        // Log role status for debugging
        bool isSell = hasRole(SELLER_ROLE, msg.sender);

        require(
            isSell,
            string(abi.encodePacked(
                "Caller must be a seller. Seller status: ",
                isSell ? "true" : "false"
            ))
        );

        // Verify minting rights with detailed error
        bool hasMinter = productNFT.hasRole(productNFT.MINTER_ROLE(), address(this));
        require(hasMinter, string(abi.encodePacked(
            "SupplyChain contract needs minting rights. Current status: ",
            hasMinter ? "true" : "false"
        )));

        uint256 productId;
        
        try productNFT.createProduct(
            msg.sender,
            name,
            manufacturer,
            tokenURI
        ) returns (uint256 newProductId) {
            productId = newProductId;
            
            // Initialize supply chain tracking
            Shipment memory initialShipment = Shipment({
                productId: productId,
                sender: msg.sender,
                receiver: msg.sender,
                currentStage: Stage.Created,
                timestamp: block.timestamp,
                location: "Manufacturing Facility"
            });

            shipmentHistory[productId].push(initialShipment);
            
            // Emit events after successful creation
            emit ProductCreated(productId, name, msg.sender);
            emit StageUpdated(productId, Stage.Created);
            
            return productId;
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked(
                "ProductNFT creation failed: ",
                reason,
                ". Caller: ",
                addressToString(msg.sender)
            )));
        } catch (bytes memory) {
            revert(string(abi.encodePacked(
                "ProductNFT creation failed with unknown error. Caller: ",
                addressToString(msg.sender)
            )));
        }
    }
    /**
     * @dev Converts an address to its string representation
     */
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
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
            hasRole(SELLER_ROLE, msg.sender),
            "Caller must be a seller"
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
            hasRole(SELLER_ROLE, msg.sender),
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
            hasRole(SELLER_ROLE, msg.sender),
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
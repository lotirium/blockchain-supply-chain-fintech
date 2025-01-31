// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ProductNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Product struct to store product information
    struct Product {
        string name;
        string manufacturer;
        uint256 manufactureDate;
        string status;
        address currentOwner;
    }

    // Mapping from token ID to Product
    mapping(uint256 => Product) private _products;

    // Events
    event ProductCreated(uint256 indexed tokenId, string name, address manufacturer);
    event ProductTransferred(uint256 indexed tokenId, address from, address to);
    event ProductStatusUpdated(uint256 indexed tokenId, string newStatus);

    constructor() ERC721("Product NFT", "PNFT") {}

    /**
     * @dev Creates a new product NFT
     * @param recipient Address that will own the NFT
     * @param name Product name
     * @param manufacturer Manufacturer name
     * @param tokenURI URI containing product metadata
     */
    function createProduct(
        address recipient,
        string memory name,
        string memory manufacturer,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        _products[newTokenId] = Product({
            name: name,
            manufacturer: manufacturer,
            manufactureDate: block.timestamp,
            status: "Created",
            currentOwner: recipient
        });

        emit ProductCreated(newTokenId, name, recipient);
        return newTokenId;
    }

    /**
     * @dev Updates the status of a product
     * @param tokenId The ID of the product token
     * @param newStatus New status to set
     */
    function updateProductStatus(uint256 tokenId, string memory newStatus) public {
        require(_exists(tokenId), "Product does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not authorized");
        
        _products[tokenId].status = newStatus;
        emit ProductStatusUpdated(tokenId, newStatus);
    }

    /**
     * @dev Gets product information
     * @param tokenId The ID of the product token
     */
    /**
     * @dev Gets the current token count
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIds.current();
    }

    function getProduct(uint256 tokenId) public view returns (
        string memory name,
        string memory manufacturer,
        uint256 manufactureDate,
        string memory status,
        address currentOwner
    ) {
        require(_exists(tokenId), "Product does not exist");
        Product memory product = _products[tokenId];
        return (
            product.name,
            product.manufacturer,
            product.manufactureDate,
            product.status,
            product.currentOwner
        );
    }

    /**
     * @dev Override transfer function to update current owner
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._transfer(from, to, tokenId);
        _products[tokenId].currentOwner = to;
        emit ProductTransferred(tokenId, from, to);
    }
}
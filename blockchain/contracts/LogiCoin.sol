// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract LogiCoin is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Exchange rate: 1 USD = 100 LogiCoin
    uint256 public constant EXCHANGE_RATE = 100;
    
    event TokensPurchased(address indexed buyer, uint256 usdAmount, uint256 tokenAmount);
    event TokensSold(address indexed seller, uint256 tokenAmount, uint256 usdAmount);

    constructor() ERC20("LogiCoin", "LOGI") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Mint new tokens when converting from USD
     * @param to Address receiving the tokens
     * @param usdAmount Amount in USD (with 2 decimals, e.g. 100.50 = 10050)
     */
    function mintFromUSD(address to, uint256 usdAmount) 
        public 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(usdAmount > 0, "Amount must be positive");
        uint256 tokenAmount = usdAmount * EXCHANGE_RATE;
        _mint(to, tokenAmount);
        emit TokensPurchased(to, usdAmount, tokenAmount);
    }

    /**
     * @dev Burn tokens when converting back to USD
     * @param from Address to burn tokens from
     * @param tokenAmount Amount of tokens to burn
     */
    function burnForUSD(address from, uint256 tokenAmount)
        public
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        require(tokenAmount > 0, "Amount must be positive");
        require(tokenAmount % EXCHANGE_RATE == 0, "Amount must be divisible by exchange rate");
        
        uint256 usdAmount = tokenAmount / EXCHANGE_RATE;
        _burn(from, tokenAmount);
        emit TokensSold(from, tokenAmount, usdAmount);
    }

    /**
     * @dev Convert USD amount to LogiCoin amount
     * @param usdAmount Amount in USD (with 2 decimals)
     * @return Token amount
     */
    function usdToTokens(uint256 usdAmount) public pure returns (uint256) {
        return usdAmount * EXCHANGE_RATE;
    }

    /**
     * @dev Convert LogiCoin amount to USD amount
     * @param tokenAmount Amount of LogiCoins
     * @return USD amount (with 2 decimals)
     */
    function tokensToUSD(uint256 tokenAmount) public pure returns (uint256) {
        return tokenAmount / EXCHANGE_RATE;
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
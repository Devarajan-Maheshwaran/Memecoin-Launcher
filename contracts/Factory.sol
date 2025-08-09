// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// Import the MyToken contract from Tokens.sol file
import { MyToken } from "./Tokens.sol";

// Simple interface for ERC20 token transfers
interface IERC20 {
    // Transfer tokens from one address to another
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title Factory
 * @dev A factory contract that creates and manages token sales
 * Users can create new tokens and buy/sell them through this factory
 */
contract Factory {
    // Maximum tokens that can be sold in one sale (500,000 tokens)
    uint256 public constant TOKEN_LIMIT = 500_000 ether;
    
    // Fee required to create a new token
    uint256 public immutable factoryFee;
    
    // Owner of the factory (who can withdraw fees)
    address public owner; 
    
    // Total number of tokens created
    uint256 public totalTokens;

    // Array of all token addresses created by this factory
    address[] public tokens;

    // Mapping from token address to its sale details
    mapping(address => TokenSale) public tokentoSale;

    /**
     * @dev Details about a token sale
     * @param token The token contract address
     * @param name The name of the token
     * @param creator Who created this token
     * @param sold How many tokens have been sold so far
     * @param raised How much ETH has been raised from sales
     * @param isOpen Whether the sale is still active
     */
    struct TokenSale {
        address token;
        string name;
        address creator;
        uint256 sold;
        uint256 raised;
        bool isOpen;
    }
    
    // Events emitted by the contract
    event TokenCreated(address indexed token);  // When a new token is created
    event Buy(address indexed token, uint256 amount);  // When tokens are bought

    /**
     * @dev Constructor sets the factory fee and owner
     * @param _fee The fee required to create a new token
     */
    constructor(uint256 _fee) {
        factoryFee = _fee;
        owner = msg.sender;
    }
    
    /**
     * @dev Get details about a specific token sale
     * @param _index The index of the token in the tokens array
     * @return The TokenSale details
     */
    function getTokenSale(uint256 _index) public view returns(TokenSale memory) {
        return tokentoSale[tokens[_index]];
    }

    /**
     * @dev Calculate the current price of tokens based on how many have been sold
     * Uses a bonding curve: price increases as more tokens are sold
     * @param _sold How many tokens have been sold so far
     * @return The current price per token in ETH
     */
    function getCost(uint256 _sold) public pure returns(uint256){
        uint256 floor = 0.0001 ether;  // Minimum price: 0.0001 ETH per token
        uint256 step = 0.0001 ether;   // Price increases by 0.0001 ETH per 1000 tokens sold
        uint256 increment = 1000 ether; // Price changes every 1000 tokens
        
        // Price = floor + (step * number of 1000-token increments sold)
        uint256 cost = floor + (step * (_sold / increment));
        return cost;
    }
    
    /**
     * @dev Create a new token and start a sale
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * Must pay at least the factory fee to create a token
     */
    function createToken(string memory _name, string memory _symbol) external payable {
        require(msg.value >= factoryFee, "Insufficient fee sent");
        
        // Create new token with 1 million total supply
        MyToken token = new MyToken(
            msg.sender,  // Creator gets ownership initially
            _name,
            _symbol,
            1_000_000 ether  // 1 million tokens
        );

        emit TokenCreated(address(token));

        // Add token to tracking arrays
        tokens.push(address(token));
        totalTokens++;

        // Create sale record
        TokenSale memory sales = TokenSale(
            address(token),
            _name,
            msg.sender,  // Creator of the token
            0,           // No tokens sold yet
            0,           // No ETH raised yet
            true         // Sale is open
        );

        tokentoSale[address(token)] = sales;
    }

    /**
     * @dev Buy tokens from an active sale
     * @param _token The token contract address to buy from
     * @param _amount How many tokens to buy (in wei units)
     * Must pay the correct amount based on current price
     */
    function buyToken(address _token, uint256 _amount) external payable {
        TokenSale storage sale = tokentoSale[_token];
        
        // Check sale is active
        require(sale.isOpen == true, "Sale is not open");
        
        // Check minimum purchase amount
        require(_amount >= 1 ether, "Amount must be at least 1 token");
        
        // Calculate total cost based on current price
        uint256 cost = getCost(sale.sold);
        uint256 totalCost = cost * _amount / 1e18;
        
        // Check sufficient payment
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Update sale records
        sale.sold += _amount;
        sale.raised += msg.value;
        
        // Close sale if token limit reached
        if(sale.sold >= TOKEN_LIMIT) {
            sale.isOpen = false;
        }
        
        // Transfer tokens to buyer
        IERC20 token = IERC20(_token);
        token.transferFrom(
            address(this),  // From factory contract
            msg.sender,     // To buyer
            _amount
        );

        emit Buy(_token, _amount);
    }

    /**
     * @dev Withdraw collected fees to owner
     * Only the owner can call this function
     */
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        
        // Transfer all ETH balance to owner
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { MyToken } from "./Tokens.sol";

contract Factory{
    uint256 public immutable fee;
    address public owner; 
    uint256 totalTokens;

    address[] public tokens;

    mapping(address => TokenSale) public tokentoSale;

    struct TokenSale {
        address token;
        string name;
        address creator;
        uint256 sold;
        uint256 raised;
        bool isOpen;
    };

    constructor(uint256 _fee){
        fee = _fee;
        owner = msg.sender;
    }
    
    event TokenCreated(address tokenAddress);

    function getTokenSale(uint256 _index) public view returns( TokenSale memory ){
        return tokentoSale[tokens[_index]];
    }
    
    function createToken(string memory _name, string memory _symbol) external payable {
        MyToken token = new MyToken(
            msg.sender,
            _name,
            _symbol,
            1_000_000 ether            
        );
        emit TokenCreated(address(token));

        tokens.push(address(token));

        totalTokens++;

        TokenSale memory sales = TokenSale(
            address(token),
            _name,
            msg.sender,
            0,
            0,
            true
        );

        tokentoSale[address(token)] = sales;
    }
    
}
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { MyToken } from "./Tokens.sol";

contract Factory{
    uint256 public immutable fee;
    address public owner; 
    uint256 totalTokens;

    address[] public tokens;

    constructor(uint256 _fee){
        fee = _fee;
        owner = msg.sender;
    }
    
    event TokenCreated(address tokenAddress);

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
    }
}
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Factory{
    uint256 public immutable fee;
    address public owner; 

    constructor(uint256 _fee){
        fee = _fee;
        owner = msg.sender;
    }
    
}
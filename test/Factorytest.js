const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")
const { expect } = require("chai")
const { ethers } = require("hardhat")

describe ("Factory", function(){

    it("should have a name", async function(){
        // Fetch Contract
        const Factory = await ethers.getContractFactory("Factory")
        // Deploy Contract
        const factory = await Factory.deploy();
        // Check Name
        const name = await factory.name();
        expect(name).to.equal("Factory");
        

    })
})
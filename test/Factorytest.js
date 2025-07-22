const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")
const { expect } = require("chai")
const { ethers } = require("hardhat")

describe ("Factory", function(){

    async function Deployfactoryfixture() {
        // Fetch Contract
        const Factory = await ethers.getContractFactory("Factory")
        // Deploy Contract
        const factory = await Factory.deploy()

        return { factory }
    }

    it("should have a name", async function(){
        const { factory } = await Deployfactoryfixture()
        // Check Name
        const name = await factory.name()
        expect(name).to.equal("Factory")
        

    })
})
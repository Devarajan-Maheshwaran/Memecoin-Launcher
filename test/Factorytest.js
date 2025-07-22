const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require("chai")
const { ethers } = require("hardhat")

describe ("Factory", function(){
    
    const Fee = ethers.parseUnits("0.01",18)
    
    async function DeployFactoryFixture() {
        //Fetch Accounts
        const [deployers] = await ethers.getSigners()
        // Fetch Contract
        const Factory = await ethers.getContractFactory("Factory")
        // Deploy Contract
        const factory = await Factory.deploy(Fee)

        return { factory, deployers }
    }

    describe("Deployment", function(){
        it("Should equal the fee", async function(){
            const { factory } = await loadFixture(DeployFactoryFixture)
            expect(await factory.fee().to.equal(Fee))
        })
        it("Should set the owner", async function(){
            const { deployers } = await loadFixture(DeployFactoryFixture)
            expect(await (factory.owner()).to.equal(deployers.address))
        })
    })


})
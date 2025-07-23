// Import necessary Hardhat and Chai helpers
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require("chai")
const { ethers } = require("hardhat")

// Set the deployment fee (0.01 ETH, 18 decimals)
const Fee = ethers.parseUnits("0.01",18)

// Fixture to deploy Factory and create a token for each test
async function DeployFactoryFixture() {
    // Fetch deployer and creator accounts
    const [deployers, creator] = await ethers.getSigners()
    // Get Factory contract factory
    const Factory = await ethers.getContractFactory("Factory")
    // Deploy Factory contract with fee
    const factory = await Factory.deploy(Fee)
    // Creator creates a new token via Factory
    const transaction = await factory.connect(creator).createToken("BRX", "BRX", {value : Fee})
    await transaction.wait()
    // Get the address of the newly created token
    const tokenAddress = await factory.tokens(0)    
    // Get the MyToken contract instance at the token address
    const token = await ethers.getContractAt("MyToken", tokenAddress)

    // Return all relevant objects for tests
    return { factory, deployers, token, creator }
}

// Main test suite for Factory contract
describe ("Factory", function(){
    // Test deployment-related properties
    describe("Deployment", function(){
        it("Should equal the fee", async function(){
            // Check if the fee is set correctly
            const { factory } = await loadFixture(DeployFactoryFixture)
            expect(await factory.fee()).to.equal(Fee)
        })
        it("Should set the owner", async function(){
            // Check if the deployer is set as the owner
            const { factory, deployers } = await loadFixture(DeployFactoryFixture)
            expect(await factory.owner()).to.equal(deployers.address)
        })
    })

    // Test token creation and its properties
    describe("Create Token", function(){
        it("Should set the owner", async function(){
            // The Factory should be the owner of the new token
            const { factory, token  } = await loadFixture(DeployFactoryFixture)
            expect(await token.owner()).to.equal(await factory.getAddress())
        })

        it("Should set the creator", async function(){
            // The creator should be set correctly in the token
            const {token, creator} = await loadFixture(DeployFactoryFixture)
            expect(await token.creator()).to.equal(creator.address) 
        })

        it("Should set the supply", async function(){
            // The Factory should hold the initial supply of the token
            const { factory, token } = await loadFixture(DeployFactoryFixture)
            expect(await token.balanceOf(factory.getAddress())).to.equal(ethers.parseUnits("1000000", 18))
        })

        it("Should set ETH balance", async function(){
            // The Factory should receive the fee in ETH
            const { factory } = await loadFixture(DeployFactoryFixture)
            const balance = await ethers.provider.getBalance(factory.getAddress())
            expect(balance).to.equal(Fee)
        })

        it("Should create the sale", async function(){
            const { factory, token } = await loadFixture(DeployFactoryFixture)

            const count = await factory.totalTokens()
            expect(count).to.equal(1)

            const sale = await factory.getTokenSale(0)
    })
})
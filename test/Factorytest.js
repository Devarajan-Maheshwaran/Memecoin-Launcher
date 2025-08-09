// Import testing tools
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require("chai")
const { ethers } = require("hardhat")

// Fee to create a token: 0.01 ETH
const Fee = ethers.parseUnits("0.01", 18)

// Setup function: deploys factory and creates first token
async function DeployFactoryFixture() {
    // Get test accounts
    const [deployers, creator, buyer] = await ethers.getSigners()
    
    // Deploy factory contract
    const Factory = await ethers.getContractFactory("Factory")
    const factory = await Factory.deploy(Fee)
    
    // Create first token
    await factory.connect(creator).createToken("BRX", "BRX", {value: Fee})
    
    // Get token contract
    const tokenAddress = await factory.tokens(0)
    const token = await ethers.getContractAt("MyToken", tokenAddress)
    
    return { factory, deployers, token, creator, buyer }
}

// Setup function: buy tokens from existing sale
async function buyTokenFixture() {
    const {factory, token, creator, buyer} = await DeployFactoryFixture()
    
    // Buy 10,000 tokens for 1 ETH
    const AMOUNT = ethers.parseUnits("10000", 18)
    const COST = ethers.parseUnits("1", 18)
    
    await factory.connect(buyer).buyToken(token.getAddress(), AMOUNT, {value: COST})
    
    return { factory, token, creator, buyer }
}

// Test the Factory contract
describe("Factory", function() {
    
    // Test deployment
    describe("Deployment", function() {
        it("Should set correct fee", async function() {
            const { factory } = await loadFixture(DeployFactoryFixture)
            expect(await factory.fee()).to.equal(Fee)
        })
        
        it("Should set correct owner", async function() {
            const { factory, deployers } = await loadFixture(DeployFactoryFixture)
            expect(await factory.owner()).to.equal(deployers.address)
        })
    })

    // Test token creation
    describe("Create Token", function() {
        it("Factory should own the token", async function() {
            const { factory, token } = await loadFixture(DeployFactoryFixture)
            expect(await token.owner()).to.equal(await factory.getAddress())
        })

        it("Should set correct creator", async function() {
            const {token, creator} = await loadFixture(DeployFactoryFixture)
            expect(await token.creator()).to.equal(creator.address)
        })

        it("Factory should hold all tokens", async function() {
            const { factory, token } = await loadFixture(DeployFactoryFixture)
            expect(await token.balanceOf(factory.getAddress())).to.equal(ethers.parseUnits("1000000", 18))
        })

        it("Factory should receive creation fee", async function() {
            const { factory } = await loadFixture(DeployFactoryFixture)
            const balance = await ethers.provider.getBalance(factory.getAddress())
            expect(balance).to.equal(Fee)
        })

        it("Should create sale record", async function() {
            const { factory, token, creator } = await loadFixture(DeployFactoryFixture)
            
            expect(await factory.totalTokens()).to.equal(1)
            
            const sale = await factory.getTokenSale(0)
            expect(sale.token).to.equal(token.getAddress())
            expect(sale.creator).to.equal(creator.address)
            expect(sale.sold).to.equal(0)
            expect(sale.raised).to.equal(0)
            expect(sale.isOpen).to.equal(true)
        })
    })

    // Test buying tokens
    describe("Buying", function() {
        const AMOUNT = ethers.parseUnits("10000", 18)
        const COST = ethers.parseUnits("1", 18)

        it("Should increase factory ETH balance", async function() {
            const { factory } = await loadFixture(buyTokenFixture)
            const balance = await ethers.provider.getBalance(await factory.getAddress())
            expect(balance).to.equal(Fee.add(COST))
        })

        it("Should transfer tokens to buyer", async function() {
            const { token, buyer } = await loadFixture(buyTokenFixture)
            expect(await token.balanceOf(buyer.address)).to.equal(AMOUNT)
        })

        it("Should update sale records", async function() {
            const { factory, token } = await loadFixture(buyTokenFixture)
            const sale = await factory.getTokenSale(0)
            
            expect(sale.sold).to.equal(AMOUNT)
            expect(sale.raised).to.equal(COST)
            expect(sale.isOpen).to.equal(true)
        })

        it("Should increase token price", async function() {
            const { factory, token } = await loadFixture(buyTokenFixture)
            const sale = await factory.tokenToSale(token.getAddress())
            const cost = await factory.getCost(sale.sold)
            expect(cost).to.equal(ethers.parseUnits("0.0002", 18))
        })
    })
})

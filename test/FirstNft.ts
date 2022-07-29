const {expect} = require("chai")
const {ethers} = require("hardhat")

describe("FirstNft", async function () {
  // const ONE_GWEI = 1_000_000_000;
  const MIN_MINT = 1_000_000_000_000_0000;

  it("Will not mint insufficient ether", async function () {
    const [owner, otherAccount] = await ethers.getSigners();

    const FirstNft = await ethers.getContractFactory("FirstNft")
    const contract = await FirstNft.deploy()
    await contract.deployed()

    await expect(contract.mint(owner, "first image", {value: 1})).to.be.revertedWith(
        "You need to pay at least 0.01 ETH to mint"
    );
  })

  it("Will not mint 101 nft", async function () {
    const [owner, otherAccount] = await ethers.getSigners();

    const FirstNft = await ethers.getContractFactory("FirstNft")
    const contract = await FirstNft.deploy()
    await contract.deployed();

    for (let i = 0; i < 100; i++) {
      contract.mint(owner, "first image", {value: MIN_MINT});
    }
    await expect(contract.mint(owner, "first image", {value: MIN_MINT})).to.be.revertedWith(
        "Total supply cannot exceed 100"
    );
  })

  it("Will transfer only to owner and change balance", async function () {
    const [owner, otherAccount] = await ethers.getSigners();

    const FirstNft = await ethers.getContractFactory("FirstNft")
    const contract = await FirstNft.deploy()
    await contract.deployed();
    contract.mint(otherAccount, "first image", {value: MIN_MINT});

    expect(await ethers.provider.getBalance(contract.address)).to.equal(
        MIN_MINT
    );

    await expect(await contract.connect(otherAccount).withdraw()).to.be.revertedWith(
        "Only owner can withdraw funds"
    );

    await expect(contract.connect(owner).withdraw()).to.changeEtherBalances(
        [owner, contract],
        [MIN_MINT, -MIN_MINT]
    );
  })

})
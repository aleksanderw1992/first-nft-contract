import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';

const {expect} = require("chai")
const {ethers} = require("hardhat")

describe("FirstNft", function () {
  const MIN_MINT = ethers.utils.parseEther("0.01");
  const MINUS_MIN_MINT = ethers.utils.parseEther("-0.01"); // NOTE -> -MIN_MINT will cause overflow error

  async function deployFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const FirstNft = await ethers.getContractFactory("FirstNft")
    const contract = await FirstNft.deploy();
    await contract.deployed();

    return {contract, owner, otherAccount};

  }

  it("Will deploy contract", async function () {
    await loadFixture(deployFixture);
  });

  it("Will not mint insufficient ether", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    await expect(contract.mint(owner.address, "first image", {value: 1})).to.be.revertedWith(
        "You need to pay at least 0.01 ETH for each NFT to mint"
    );
  });

  it("Will not mint 101 nft", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    for (let i = 0; i < 100; i++) {
      contract.mint(owner.address, i + "-th image", {value: MIN_MINT});
    }
    await expect(contract.mint(owner.address, "101th image", {value: MIN_MINT})).to.be.revertedWith(
        "Total nft supply cannot exceed 100"
    );
  });

  it("Will transfer only to owner and change balance", async function () {
    const {contract, owner, otherAccount} = await loadFixture(deployFixture);

    contract.mint(otherAccount.address, "first image", {value: MIN_MINT});

    expect(await ethers.provider.getBalance(contract.address)).to.equal(
        MIN_MINT
    );

    await expect(contract.connect(otherAccount).withdraw()).to.be.revertedWith(
        "Only owner can withdraw funds"
    );

    await expect(contract.connect(owner).withdraw()).to.changeEtherBalances(
        [owner, contract],
        [MIN_MINT, MINUS_MIN_MINT]
    );
  });

});
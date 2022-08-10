import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';

const {expect} = require("chai")
const {ethers} = require("hardhat")

describe("FirstNft", function () {
  const INSUFFICIENT_ETHER = ethers.utils.parseEther("0.009");
  const MIN_MINT_SINGLE_NFT = ethers.utils.parseEther("0.01");
  const MINUS_MINT_SINGLE_NFT = ethers.utils.parseEther("-0.01"); // NOTE -> -MIN_MINT_SINGLE_NFT will cause overflow error
  const MINT_TWO_NFT = ethers.utils.parseEther("0.02");
  const MINT_FIVE_NFT = ethers.utils.parseEther("0.05");
  const MINT_SIX_NFT = ethers.utils.parseEther("0.06");

  async function deployFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const FirstNft = await ethers.getContractFactory("FirstNft");
    const contract = await FirstNft.deploy();
    await contract.deployed();

    return {contract, owner, otherAccount};

  }

  it("Will deploy contract", async function () {
    await loadFixture(deployFixture);
  });

  it("Will not mint insufficient ether", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    await expect(contract["mint(address)"](owner.address, {value: INSUFFICIENT_ETHER})).to.be.revertedWith(
        "You need to pay at least 0.01 ETH for each NFT to mint"
    );
  });

  it("Will not mint insufficient ether - mint 2 nfts", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    await expect(contract["mint(address,uint8)"](owner.address, 2, {value: MIN_MINT_SINGLE_NFT})).to.be.revertedWith(
        "You need to pay at least 0.01 ETH for each NFT to mint"
    );
  });

  it("Will  mint 2 nfts in a single transaction", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    await expect(contract["mint(address,uint8)"](owner.address, 2, {value: MINT_TWO_NFT})).not.to.be.reverted;
  });

  it("Will  mint 5 nfts in a single transaction", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    await expect(contract["mint(address,uint8)"](owner.address, 5, {value: MINT_FIVE_NFT})).not.to.be.reverted;
  });

  it("Will not mint 6 nfts in a single transaction", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    await expect(contract["mint(address,uint8)"](owner.address, 6, {value: MINT_SIX_NFT})).to.be.revertedWith(
        "You can mint at most 5 NFTs in single transaction"
    );
  });

  it("Will not mint 101 nft", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    for (let i = 0; i < 100; i++) {
      await expect(contract["mint(address)"](owner.address, {value: MIN_MINT_SINGLE_NFT})).not.to.be.reverted;
    }
    await expect(contract["mint(address)"](owner.address, {value: MIN_MINT_SINGLE_NFT})).to.be.revertedWith(
        "Total nft supply cannot exceed 100"
    );
  });

  it("Will not mint 101 nft - mint 2 nfts from 99 index", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    for (let i = 0; i < 99; i++) {
      await expect(contract["mint(address)"](owner.address, {value: MIN_MINT_SINGLE_NFT})).not.to.be.reverted;
    }
    await expect(contract["mint(address,uint8)"](owner.address, 2, {value: MINT_TWO_NFT})).to.be.revertedWith(
        "Total nft supply cannot exceed 100"
    );
  });

  it("Will transfer only to owner and change balance", async function () {
    const {contract, owner, otherAccount} = await loadFixture(deployFixture);

    await expect(contract["mint(address)"](otherAccount.address, {value: MIN_MINT_SINGLE_NFT})).not.to.be.reverted;

    expect(await ethers.provider.getBalance(contract.address)).to.equal(
        MIN_MINT_SINGLE_NFT
    );

    await expect(contract.connect(otherAccount).withdraw()).to.be.revertedWith(
        "Only owner can withdraw funds"
    );

    await expect(contract.connect(owner).withdraw()).to.changeEtherBalances(
        [owner, contract],
        [MIN_MINT_SINGLE_NFT, MINUS_MINT_SINGLE_NFT]
    );
  });

});
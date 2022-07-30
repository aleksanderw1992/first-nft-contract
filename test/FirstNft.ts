import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';

const {expect} = require("chai")
const {ethers} = require("hardhat")

describe("FirstNft", function () {
  const MIN_MINT_SINGLE_NFT = ethers.utils.parseEther("0.01");
  const MINUS_MINT_SINGLE_NFT = ethers.utils.parseEther("-0.01"); // NOTE -> -MIN_MINT_SINGLE_NFT will cause overflow error
  const MINT_TWO_NFT = ethers.utils.parseEther("0.02");
  const MINT_FIVE_NFT = ethers.utils.parseEther("0.05");
  const MINT_SIX_NFT = ethers.utils.parseEther("0.06");

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

  it("Will not mint insufficient ether - mint 2 nfts", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    await expect(contract.mintMany(owner.address, ["first image", "second img"], {value: MIN_MINT_SINGLE_NFT})).to.be.revertedWith(
        "You need to pay at least 0.01 ETH for each NFT to mint"
    );
  });

  it("Will  mint 2 nfts in a single transaction", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    contract.mintMany(owner.address, ["a", "b"], {value: MINT_TWO_NFT});
  });

  it("Will  mint 5 nfts in a single transaction", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    contract.mintMany(owner.address, ["a", "b", "c", "d", "e"], {value: MINT_FIVE_NFT});
  });

  it("Will not mint 6 nfts in a single transaction", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    await expect(contract.mintMany(owner.address, ["a", "b", "c", "d", "e", "f"], {value: MINT_SIX_NFT})).to.be.revertedWith(
        "You can mint at most 5 NFTs in single transaction"
    );
  });

  it("Will not mint 101 nft", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    for (let i = 0; i < 100; i++) {
      contract.mint(owner.address, i + "-th image", {value: MIN_MINT_SINGLE_NFT});
    }
    await expect(contract.mint(owner.address, "101th image", {value: MIN_MINT_SINGLE_NFT})).to.be.revertedWith(
        "Total nft supply cannot exceed 100"
    );
  });

  it("Will not mint 101 nft - mint 2 nfts from 99 index", async function () {
    const {contract, owner} = await loadFixture(deployFixture);

    for (let i = 0; i < 99; i++) {
      contract.mint(owner.address, i + "-th image", {value: MIN_MINT_SINGLE_NFT});
    }
    await expect(contract.mintMany(owner.address, ["100th image", "101th image"], {value: MINT_TWO_NFT})).to.be.revertedWith(
        "Total nft supply cannot exceed 100"
    );
  });

  it("Will transfer only to owner and change balance", async function () {
    const {contract, owner, otherAccount} = await loadFixture(deployFixture);

    contract.mint(otherAccount.address, "first image", {value: MIN_MINT_SINGLE_NFT});

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
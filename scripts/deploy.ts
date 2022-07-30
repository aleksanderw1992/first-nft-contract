import { ethers } from "hardhat";

async function main() {
  const FirstNft = await ethers.getContractFactory("FirstNft");
  const nft = await FirstNft.deploy();

  await nft.deployed();

  console.log("FirstNft deployed: " + nft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";

async function main() {
  const token = await ethers.deployContract("Token");

  await token.waitForDeployment();

  const tokenSavings = await ethers.deployContract("SaveERC20", [token.target]);

  await tokenSavings.waitForDeployment();


  const ethSavings = await ethers.deployContract("SaveEther");

  await ethSavings.waitForDeployment();



  console.log(
    `Token contract deployed at ${token.target}... token-savings deployed at ${tokenSavings.target}... eth-savings deployed at ${ethSavings.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

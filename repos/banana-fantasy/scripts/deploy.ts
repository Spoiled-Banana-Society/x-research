import hre from "hardhat";

const { ethers } = hre;
const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Deployer: ${deployer.address}`);

  const SBSDraftPassBBB4 = await ethers.getContractFactory("SBSDraftPassBBB4");
  const contract = await SBSDraftPassBBB4.deploy(BASE_SEPOLIA_USDC);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`SBSDraftPassBBB4 deployed to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

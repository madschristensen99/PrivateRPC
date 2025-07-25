import { ethers, network, run } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Deploy mock access token if needed (for testnet)
  console.log("Deploying mock access token...");
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy("Access Token", "ACCESS", ethers.parseEther("1000000"));
  await mockToken.waitForDeployment();
  const accessTokenAddress = await mockToken.getAddress();
  console.log(`Mock access token deployed to: ${accessTokenAddress}`);
  
  // Deploy SwapCreator from xmr-eth-atomic-swap
  console.log("Deploying SwapCreator...");
  const SwapCreator = await ethers.getContractFactory("SwapCreator");
  const swapCreator = await SwapCreator.deploy();
  await swapCreator.waitForDeployment();
  const swapCreatorAddress = await swapCreator.getAddress();
  console.log(`SwapCreator deployed to: ${swapCreatorAddress}`);

  // Deploy SwapAdapter
  console.log("Deploying SwapAdapter...");
  const SwapAdapter = await ethers.getContractFactory("XMRSwapAdapter");
  const swapAdapter = await SwapAdapter.deploy(swapCreatorAddress);
  await swapAdapter.waitForDeployment();
  const swapAdapterAddress = await swapAdapter.getAddress();
  console.log(`SwapAdapter deployed to: ${swapAdapterAddress}`);

  // Configuration for XMR Escrow Factory
  const rescueDelay = 86400; // 1 day in seconds

  // Deploy XMR Escrow Factory
  console.log("Deploying XMR Escrow Factory...");
  const XMREscrowFactory = await ethers.getContractFactory("XMREscrowFactory");
  const xmrEscrowFactory = await XMREscrowFactory.deploy(
    rescueDelay,
    accessTokenAddress,
    swapAdapterAddress
  );
  await xmrEscrowFactory.waitForDeployment();
  const factoryAddress = await xmrEscrowFactory.getAddress();
  
  console.log(`XMR Escrow Factory deployed to: ${factoryAddress}`);
  console.log(`XMR Escrow SRC Implementation: ${await xmrEscrowFactory.srcImplementation()}`);

  // Verify contracts on Etherscan if API key is available
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await xmrEscrowFactory.deploymentTransaction()?.wait(5);
    
    try {
      await run("compile", { quiet: true } as any);
    } catch (error) {
      console.warn("Compilation warning:", error);
    }
    
    console.log("Verifying contracts on Etherscan...");
    
    // Verify SwapCreator
    await verify(swapCreatorAddress, []);
    
    // Verify SwapAdapter
    await verify(swapAdapterAddress, [swapCreatorAddress]);
    
    // Verify Factory
    await verify(factoryAddress, [
      rescueDelay,
      accessTokenAddress,
      swapAdapterAddress
    ]);
    
    // Verify implementation
    await verify(await xmrEscrowFactory.srcImplementation(), [
      rescueDelay, 
      accessTokenAddress, 
      swapAdapterAddress
    ]);
  }

  // Save deployment info to file
  const deploymentInfo = {
    network: network.name,
    factoryAddress,
    accessTokenAddress,
    srcImplementation: await xmrEscrowFactory.srcImplementation(),
    swapCreatorAddress,
    swapAdapterAddress,
    timestamp: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    `./deployment-xmr-${network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to file");
}

async function verify(address: string, constructorArguments: any[]) {
  try {
    // Use the run function with explicit type parameters
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    } as any);
  } catch (error: any) {
    if (error.message.includes("already verified")) {
      console.log("Contract already verified");
    } else {
      console.error("Verification error:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

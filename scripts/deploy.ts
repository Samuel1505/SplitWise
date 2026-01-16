import { network } from "hardhat";
import hre from "hardhat";
import { verifyContract } from "@nomicfoundation/hardhat-verify/verify";

async function main() {
  // Get network name from environment (set by --network flag) or default to hardhat
  const networkName = process.env.HARDHAT_NETWORK || 
                      (process.argv.includes('--network') 
                        ? process.argv[process.argv.indexOf('--network') + 1]
                        : 'hardhat');
  
  console.log("Starting deployment...");
  console.log("Network:", networkName);
  
  // Connect to network - Hardhat will use the network from --network flag
  const connected = await network.connect();

  // Get ethers from the connection
  const ethers = connected.ethers;

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("Deployer account has no balance. Please fund the account.");
  }

  // Deploy SplitWise contract
  console.log("\nDeploying SplitWise contract...");
  const SplitWise = await ethers.getContractFactory("SplitWise");
  const splitWise = await SplitWise.deploy();

  console.log("Transaction hash:", splitWise.deploymentTransaction()?.hash);
  console.log("Waiting for deployment confirmation...");

  await splitWise.waitForDeployment();
  const contractAddress = await splitWise.getAddress();

  console.log("\n✅ SplitWise deployed to:", contractAddress);

  // Wait for a few block confirmations before verification
  console.log("\nWaiting for block confirmations...");
  await splitWise.deploymentTransaction()?.wait(5);

  // Automatically verify the contract
  console.log("\nVerifying contract on block explorer...");
  try {
    await verifyContract(
      {
        address: contractAddress,
        constructorArgs: [],
        provider: "etherscan", // or "blockscout" or "sourcify" if configured
      },
      hre
    );
    console.log("✅ Contract verified successfully!");
  } catch (error: any) {
    if (error.message?.includes("Already Verified") || error.message?.includes("already verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      console.log("\nYou can verify manually by running:");
      console.log(
        `npx hardhat verify --network ${networkName} ${contractAddress}`
      );
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", networkName);
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("\n✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

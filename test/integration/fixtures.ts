import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Shared fixtures for integration tests
 */
export async function setupIntegrationTests() {
  const [owner, user1, user2, user3, user4] = await ethers.getSigners();

  // Deploy contracts
  const splitWise = await ethers.deployContract("SplitWise");

  const MockERC20 = await ethers.getContractFactory("MockERC20", owner);
  const mockToken = await MockERC20.deploy("Token1", "T1", 18, ethers.parseEther("1000000"));
  const mockToken2 = await MockERC20.deploy("Token2", "T2", 18, ethers.parseEther("1000000"));

  return {
    splitWise,
    mockToken,
    mockToken2,
    owner,
    user1,
    user2,
    user3,
    user4,
  };
}

/**
 * Helper to get group ID from transaction receipt
 */
export async function getGroupIdFromEvent(
  splitWise: any,
  receipt: any
): Promise<bigint> {
  const event = receipt.logs.find((log: any) => {
    try {
      return splitWise.interface.parseLog(log).name === "GroupCreated";
    } catch {
      return false;
    }
  });
  return splitWise.interface.parseLog(event).args.groupId;
}


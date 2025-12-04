import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Shared fixtures for unit tests
 */
export async function setupUnitTests() {
  const [owner, user1, user2, user3] = await ethers.getSigners();
  const users = [user1, user2, user3];

  // Deploy SplitWise contract
  const splitWise = await ethers.deployContract("SplitWise");

  // Deploy mock ERC20 token
  const MockERC20 = await ethers.getContractFactory("MockERC20", owner);
  const mockToken = await MockERC20.deploy(
    "Test Token",
    "TEST",
    18,
    ethers.parseEther("1000000")
  );

  return {
    splitWise,
    mockToken,
    owner,
    user1,
    user2,
    user3,
    users,
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


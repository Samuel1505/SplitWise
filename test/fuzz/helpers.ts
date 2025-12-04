import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Fuzz test helper functions
 */
export const NUM_FUZZ_RUNS = 50; // Number of random test runs

/**
 * Helper function to generate random value in range
 */
export function randomBigInt(min: bigint, max: bigint): bigint {
  const range = max - min;
  const random = BigInt(Math.floor(Math.random() * Number(range)));
  return min + random;
}

/**
 * Helper function to split amount randomly between participants
 */
export function randomSplit(totalAmount: bigint, numParticipants: number): bigint[] {
  const shares: bigint[] = [];
  let remaining = totalAmount;
  
  for (let i = 0; i < numParticipants - 1; i++) {
    const max = remaining / BigInt(numParticipants - i);
    const share = randomBigInt(1n, max);
    shares.push(share);
    remaining -= share;
  }
  
  shares.push(remaining);
  return shares;
}

/**
 * Setup function for fuzz tests
 */
export async function setupFuzzTests() {
  const accounts = await ethers.getSigners();

  // Deploy contracts
  const splitWise = await ethers.deployContract("SplitWise");
  const MockERC20 = await ethers.getContractFactory("MockERC20", accounts[0]);
  const mockToken = await MockERC20.deploy(
    "Test Token",
    "TEST",
    18,
    ethers.parseEther("1000000000")
  );

  return {
    splitWise,
    mockToken,
    accounts,
    ethers,
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


import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";

/**
 * Helper functions for SplitWise tests
 */
export class TestHelpers {
  static async deployMockERC20(
    deployer: HardhatEthersSigner,
    name: string = "Test Token",
    symbol: string = "TEST",
    decimals: number = 18,
    initialSupply: bigint = ethers.parseEther("1000000")
  ): Promise<Contract> {
    const MockERC20 = await ethers.getContractFactory("MockERC20", deployer);
    return await MockERC20.deploy(name, symbol, decimals, initialSupply);
  }

  static async deploySplitWise(deployer: HardhatEthersSigner): Promise<Contract> {
    const SplitWise = await ethers.getContractFactory("SplitWise", deployer);
    return await SplitWise.deploy();
  }

  static async mintAndApprove(
    token: Contract,
    to: HardhatEthersSigner,
    amount: bigint,
    spender: Contract | HardhatEthersSigner
  ): Promise<void> {
    const spenderAddress = typeof spender === "object" && "getAddress" in spender 
      ? await spender.getAddress() 
      : await spender.getAddress();
    
    await token.mint(await to.getAddress(), amount);
    await token.connect(to).approve(spenderAddress, amount);
  }

  static async getEvent(
    contract: Contract,
    eventName: string,
    fromBlock: number = 0,
    toBlock: string | number = "latest"
  ) {
    const filter = contract.filters[eventName]();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    return events;
  }

  static randomAddress(): string {
    return ethers.Wallet.createRandom().address;
  }

  static randomAmount(min: bigint = 1n, max: bigint = ethers.parseEther("1000")): bigint {
    const range = max - min;
    const random = BigInt(Math.floor(Math.random() * Number(range)));
    return min + random;
  }
}

// Import ethers for use in helpers
import { ethers } from "ethers";


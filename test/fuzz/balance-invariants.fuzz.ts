import { expect } from "chai";
import { network } from "hardhat";
import {
  setupFuzzTests,
  getGroupIdFromEvent,
  NUM_FUZZ_RUNS,
  randomBigInt,
  randomSplit,
} from "./helpers.js";

const { ethers } = await network.connect();

describe("SplitWise - Fuzz Tests: Balance Invariants", function () {
  let splitWise: any;
  let accounts: any[];

  beforeEach(async function () {
    const setup = await setupFuzzTests();
    splitWise = setup.splitWise;
    accounts = setup.accounts;
  });

  it("Should maintain invariant: sum of all balances in group = 0", async function () {
    const tx = await splitWise.createGroup("Balance Invariant Group", [
      await accounts[1].getAddress(),
      await accounts[2].getAddress(),
      await accounts[3].getAddress(),
    ]);
    const receipt = await tx.wait();
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

    for (let i = 0; i < NUM_FUZZ_RUNS; i++) {
      const expenseAmount = randomBigInt(ethers.parseEther("0.1"), ethers.parseEther("100"));
      const numParticipants = Math.floor(Math.random() * 3) + 2;

      const participants = [await accounts[0].getAddress()];
      const selectedIndices = new Set<number>();
      while (selectedIndices.size < numParticipants - 1 && selectedIndices.size < 3) {
        const idx = Math.floor(Math.random() * 3) + 1;
        selectedIndices.add(idx);
      }

      for (const idx of selectedIndices) {
        participants.push(await accounts[idx].getAddress());
      }

      const shares = randomSplit(expenseAmount, participants.length);

      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        expenseAmount,
        `Expense ${i}`,
        participants,
        shares
      );

      // Check invariant: sum of all balances should be zero
      let sum = 0n;
      for (const addr of participants) {
        const balance = await splitWise.getBalance(addr, groupId, ethers.ZeroAddress);
        sum += balance;
      }
      expect(sum).to.equal(0n);
    }
  });

  it("Should maintain invariant: totalBalance equals sum of group balances", async function () {
    // Create multiple groups
    const groupIds: bigint[] = [];
    for (let g = 0; g < 3; g++) {
      const tx = await splitWise.createGroup(`Group ${g}`, [
        await accounts[1].getAddress(),
      ]);
      const receipt = await tx.wait();
      groupIds.push(await getGroupIdFromEvent(splitWise, receipt));
    }

    for (let i = 0; i < NUM_FUZZ_RUNS; i++) {
      const groupId = groupIds[Math.floor(Math.random() * groupIds.length)];
      const expenseAmount = randomBigInt(ethers.parseEther("0.1"), ethers.parseEther("100"));

      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        expenseAmount,
        `Expense ${i}`,
        [await accounts[0].getAddress(), await accounts[1].getAddress()],
        [expenseAmount / 2n, expenseAmount / 2n]
      );

      // Check invariant: totalBalance should equal sum of balances across all groups
      let sumOfGroupBalances = 0n;
      for (const gid of groupIds) {
        const balance = await splitWise.getBalance(
          await accounts[1].getAddress(),
          gid,
          ethers.ZeroAddress
        );
        sumOfGroupBalances += balance;
      }

      const totalBalance = await splitWise.getTotalBalance(
        await accounts[1].getAddress(),
        ethers.ZeroAddress
      );
      expect(totalBalance).to.equal(sumOfGroupBalances);
    }
  });
});


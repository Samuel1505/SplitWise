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

describe("SplitWise - Fuzz Tests: Expense Creation", function () {
  let splitWise: any;
  let mockToken: any;
  let accounts: any[];

  beforeEach(async function () {
    const setup = await setupFuzzTests();
    splitWise = setup.splitWise;
    mockToken = setup.mockToken;
    accounts = setup.accounts;
  });

  it("Should maintain balance invariants with random expense amounts", async function () {
    // Create a base group
    const tx = await splitWise.createGroup("Fuzz Group", [
      await accounts[1].getAddress(),
      await accounts[2].getAddress(),
      await accounts[3].getAddress(),
    ]);
    const receipt = await tx.wait();
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

    let cumulativePayerBalance = 0n;
    let cumulativeParticipantBalances: { [key: string]: bigint } = {};

    for (let i = 0; i < NUM_FUZZ_RUNS; i++) {
      // Random amount between 0.001 and 1000 ETH
      const expenseAmount = randomBigInt(
        ethers.parseEther("0.001"),
        ethers.parseEther("1000")
      );

      // Random number of participants (2-4)
      const numParticipants = Math.floor(Math.random() * 3) + 2;
      const participants = [await accounts[0].getAddress()];
      const participantAddresses: string[] = [];

      // Select random participants
      const selectedIndices = new Set<number>();
      while (selectedIndices.size < numParticipants - 1 && selectedIndices.size < 3) {
        const idx = Math.floor(Math.random() * 3) + 1;
        selectedIndices.add(idx);
      }

      for (const idx of selectedIndices) {
        const addr = await accounts[idx].getAddress();
        participants.push(addr);
        participantAddresses.push(addr);
      }

      // Random split
      const shares = randomSplit(expenseAmount, participants.length);

      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        expenseAmount,
        `Expense ${i}`,
        participants,
        shares
      );

      // Update cumulative balances
      cumulativePayerBalance -= expenseAmount;
      for (let j = 1; j < participants.length; j++) {
        const addr = participants[j];
        cumulativePayerBalance += shares[j];
        if (!cumulativeParticipantBalances[addr]) {
          cumulativeParticipantBalances[addr] = 0n;
        }
        cumulativeParticipantBalances[addr] += shares[j];
      }

      // Verify balances match cumulative
      const payerBalance = await splitWise.getBalance(
        await accounts[0].getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(payerBalance).to.equal(cumulativePayerBalance);

      // Verify each participant's balance
      for (const addr of participantAddresses) {
        const balance = await splitWise.getBalance(addr, groupId, ethers.ZeroAddress);
        const expectedBalance = cumulativeParticipantBalances[addr] || 0n;
        expect(balance).to.equal(expectedBalance);
      }
    }
  });

  it("Should handle various token amounts and splits correctly", async function () {
    const tx = await splitWise.createGroup("Token Fuzz Group", [
      await accounts[1].getAddress(),
      await accounts[2].getAddress(),
    ]);
    const receipt = await tx.wait();
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

    for (let i = 0; i < NUM_FUZZ_RUNS; i++) {
      const expenseAmount = randomBigInt(1n, ethers.parseEther("1000"));
      const participants = [
        await accounts[0].getAddress(),
        await accounts[1].getAddress(),
        await accounts[2].getAddress(),
      ];
      const shares = randomSplit(expenseAmount, participants.length);

      await splitWise.createExpense(
        groupId,
        await mockToken.getAddress(),
        expenseAmount,
        `Token Expense ${i}`,
        participants,
        shares
      );

      // Verify shares sum to amount
      const totalShares = shares.reduce((sum, share) => sum + share, 0n);
      expect(totalShares).to.equal(expenseAmount);

      // Verify balances are correct
      for (let j = 1; j < participants.length; j++) {
        const balance = await splitWise.getBalance(
          participants[j],
          groupId,
          await mockToken.getAddress()
        );
        expect(balance).to.be.greaterThanOrEqual(shares[j]);
      }
    }
  });
});


import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Fuzz Tests for SplitWise Contract
 * These tests use property-based testing to verify invariants hold under various inputs
 */

describe("SplitWise - Fuzz Tests", function () {
  let splitWise: any;
  let mockToken: any;
  let accounts: any[];
  const NUM_FUZZ_RUNS = 50; // Number of random test runs

  beforeEach(async function () {
    accounts = await ethers.getSigners();

    // Deploy contracts
    splitWise = await ethers.deployContract("SplitWise");
    const MockERC20 = await ethers.getContractFactory("MockERC20", accounts[0]);
    mockToken = await MockERC20.deploy("Test Token", "TEST", 18, ethers.parseEther("1000000000"));
  });

  /**
   * Helper function to generate random value in range
   */
  function randomBigInt(min: bigint, max: bigint): bigint {
    const range = max - min;
    const random = BigInt(Math.floor(Math.random() * Number(range)));
    return min + random;
  }

  /**
   * Helper function to split amount randomly between participants
   */
  function randomSplit(totalAmount: bigint, numParticipants: number): bigint[] {
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

  describe("Fuzz: Group Creation", function () {
    it("Should always create valid groups with random names and members", async function () {
      for (let i = 0; i < NUM_FUZZ_RUNS; i++) {
        const numMembers = Math.floor(Math.random() * 10) + 1; // 1-10 members
        const memberAddresses = [];
        
        // Select random unique members
        const selectedIndices = new Set<number>();
        while (selectedIndices.size < numMembers && selectedIndices.size < accounts.length - 1) {
          const idx = Math.floor(Math.random() * (accounts.length - 1)) + 1;
          selectedIndices.add(idx);
        }
        
        for (const idx of selectedIndices) {
          memberAddresses.push(await accounts[idx].getAddress());
        }

        const groupName = `Group ${Math.random().toString(36).substring(7)}`;
        
        const tx = await splitWise.createGroup(groupName, memberAddresses);
        const receipt = await tx.wait();
        
        const event = receipt.logs.find((log: any) => {
          try {
            return splitWise.interface.parseLog(log).name === "GroupCreated";
          } catch {
            return false;
          }
        });
        
        expect(event).to.not.be.undefined;
        const parsedEvent = splitWise.interface.parseLog(event);
        const groupId = parsedEvent.args.groupId;
        
        // Verify group exists
        const group = await splitWise.getGroup(groupId);
        expect(group[0]).to.equal(groupId);
        expect(group[1]).to.equal(groupName);
        expect(group[3].length).to.equal(memberAddresses.length + 1); // +1 for creator
      }
    });
  });

  describe("Fuzz: Expense Creation", function () {
    it("Should maintain balance invariants with random expense amounts", async function () {
      // Create a base group
      const tx = await splitWise.createGroup("Fuzz Group", [
        await accounts[1].getAddress(),
        await accounts[2].getAddress(),
        await accounts[3].getAddress(),
      ]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

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
        const participants = [await accounts[0].getAddress()]; // Always include payer
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
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

      for (let i = 0; i < NUM_FUZZ_RUNS; i++) {
        // Test with ERC20 token
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
          // Balance should accumulate across all expenses
          expect(balance).to.be.greaterThanOrEqual(shares[j]);
        }
      }
    });
  });

  describe("Fuzz: Payment Settlement", function () {
    it("Should correctly settle payments with random amounts", async function () {
      const tx = await splitWise.createGroup("Settlement Fuzz Group", [
        await accounts[1].getAddress(),
        await accounts[2].getAddress(),
      ]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

      // Create initial expense
      const expenseAmount = ethers.parseEther("1000");
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        expenseAmount,
        "Initial expense",
        [await accounts[0].getAddress(), await accounts[1].getAddress()],
        [ethers.parseEther("400"), ethers.parseEther("600")]
      );

      let remainingBalance = ethers.parseEther("600");
      const payer = accounts[1];

      for (let i = 0; i < NUM_FUZZ_RUNS && remainingBalance > 0n; i++) {
        // Random settlement amount (at most remaining balance)
        const settlementAmount = randomBigInt(1n, remainingBalance + 1n);

        const balanceBefore = await splitWise.getBalance(
          await payer.getAddress(),
          groupId,
          ethers.ZeroAddress
        );

        await splitWise
          .connect(payer)
          .settlePayment(
            groupId,
            ethers.ZeroAddress,
            settlementAmount,
            await accounts[0].getAddress(),
            { value: settlementAmount }
          );

        const balanceAfter = await splitWise.getBalance(
          await payer.getAddress(),
          groupId,
          ethers.ZeroAddress
        );

        // Verify balance decreased by settlement amount
        expect(balanceBefore - balanceAfter).to.equal(settlementAmount);

        remainingBalance = balanceAfter;
      }

      // Final balance should be zero or positive
      const finalBalance = await splitWise.getBalance(
        await payer.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(finalBalance).to.be.greaterThanOrEqual(0n);
    });

    it("Should handle partial settlements correctly with random amounts", async function () {
      const tx = await splitWise.createGroup("Partial Settlement Group", [
        await accounts[1].getAddress(),
      ]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

      // Create expense
      const expenseAmount = ethers.parseEther("1000");
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        expenseAmount,
        "Expense",
        [await accounts[0].getAddress(), await accounts[1].getAddress()],
        [ethers.parseEther("400"), ethers.parseEther("600")]
      );

      let totalSettled = 0n;
      const payer = accounts[1];
      const owedAmount = ethers.parseEther("600");

      // Make multiple partial settlements
      for (let i = 0; i < 10; i++) {
        const remaining = owedAmount - totalSettled;
        if (remaining <= 0n) break;

        const settlementAmount = randomBigInt(1n, remaining + 1n);

        const balanceBefore = await splitWise.getBalance(
          await payer.getAddress(),
          groupId,
          ethers.ZeroAddress
        );

        await splitWise
          .connect(payer)
          .settlePayment(
            groupId,
            ethers.ZeroAddress,
            settlementAmount,
            await accounts[0].getAddress(),
            { value: settlementAmount }
          );

        totalSettled += settlementAmount;

        const balanceAfter = await splitWise.getBalance(
          await payer.getAddress(),
          groupId,
          ethers.ZeroAddress
        );

        // Verify balance decreased correctly
        expect(balanceBefore - balanceAfter).to.equal(settlementAmount);
        expect(owedAmount - totalSettled).to.equal(balanceAfter);
      }
    });
  });

  describe("Fuzz: Balance Invariants", function () {
    it("Should maintain invariant: sum of all balances in group = 0", async function () {
      const tx = await splitWise.createGroup("Balance Invariant Group", [
        await accounts[1].getAddress(),
        await accounts[2].getAddress(),
        await accounts[3].getAddress(),
      ]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

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
        const event = receipt.logs.find((log: any) => {
          try {
            return splitWise.interface.parseLog(log).name === "GroupCreated";
          } catch {
            return false;
          }
        });
        groupIds.push(splitWise.interface.parseLog(event).args.groupId);
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

  describe("Fuzz: Edge Cases", function () {
    it("Should handle very large amounts", async function () {
      const tx = await splitWise.createGroup("Large Amount Group", [
        await accounts[1].getAddress(),
      ]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

      // Test with very large amount (near max uint256)
      const largeAmount = ethers.parseEther("1000000000"); // 1 billion ETH

      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        largeAmount,
        "Large expense",
        [await accounts[0].getAddress(), await accounts[1].getAddress()],
        [largeAmount / 2n, largeAmount / 2n]
      );

      const balance = await splitWise.getBalance(
        await accounts[1].getAddress(),
        groupId,
        ethers.ZeroAddress
      );

      expect(balance).to.equal(largeAmount / 2n);
    });

    it("Should handle very small amounts", async function () {
      const tx = await splitWise.createGroup("Small Amount Group", [
        await accounts[1].getAddress(),
      ]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

      // Test with very small amount (1 wei)
      const smallAmount = 1n;

      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        smallAmount,
        "Small expense",
        [await accounts[0].getAddress(), await accounts[1].getAddress()],
        [smallAmount, 0n]
      );

      const balance = await splitWise.getBalance(
        await accounts[1].getAddress(),
        groupId,
        ethers.ZeroAddress
      );

      expect(balance).to.equal(0n);
    });

    it("Should handle many expenses in sequence", async function () {
      const tx = await splitWise.createGroup("Many Expenses Group", [
        await accounts[1].getAddress(),
      ]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

      let expectedBalance = 0n;

      // Create many expenses
      for (let i = 0; i < 100; i++) {
        const amount = randomBigInt(ethers.parseEther("0.01"), ethers.parseEther("10"));
        const user1Share = amount / 2n;

        await splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          amount,
          `Expense ${i}`,
          [await accounts[0].getAddress(), await accounts[1].getAddress()],
          [amount - user1Share, user1Share]
        );

        expectedBalance += user1Share;
      }

      const balance = await splitWise.getBalance(
        await accounts[1].getAddress(),
        groupId,
        ethers.ZeroAddress
      );

      expect(balance).to.equal(expectedBalance);
    });
  });
});


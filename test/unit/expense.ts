import { expect } from "chai";
import { network } from "hardhat";
import { setupUnitTests, getGroupIdFromEvent } from "./fixtures.js";

const { ethers } = await network.connect();

describe("SplitWise - Unit Tests: Expense Creation", function () {
  let splitWise: any;
  let mockToken: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;
  let groupId: bigint;
  const expenseAmount = ethers.parseEther("100");

  beforeEach(async function () {
    const setup = await setupUnitTests();
    splitWise = setup.splitWise;
    mockToken = setup.mockToken;
    owner = setup.owner;
    user1 = setup.user1;
    user2 = setup.user2;
    user3 = setup.user3;

    const tx = await splitWise.createGroup("Test Group", [
      await user1.getAddress(),
      await user2.getAddress(),
    ]);
    const receipt = await tx.wait();
    groupId = await getGroupIdFromEvent(splitWise, receipt);
  });

  describe("createExpense", function () {
    it("Should create expense with native ETH", async function () {
      const participants = [await owner.getAddress(), await user1.getAddress()];
      const shares = [ethers.parseEther("60"), ethers.parseEther("40")];

      const tx = await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress, // ETH
        expenseAmount,
        "Dinner",
        participants,
        shares
      );
      const receipt = await tx.wait();

      // Check event
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "ExpenseCreated";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;

      const parsedEvent = splitWise.interface.parseLog(event);
      expect(parsedEvent.args.expenseId).to.equal(1n);
      expect(parsedEvent.args.groupId).to.equal(groupId);
      expect(parsedEvent.args.payer).to.equal(await owner.getAddress());
      expect(parsedEvent.args.amount).to.equal(expenseAmount);

      // Check balances
      const balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(balance).to.equal(ethers.parseEther("40"));
    });

    it("Should create expense with ERC20 token", async function () {
      const participants = [await owner.getAddress(), await user1.getAddress()];
      const shares = [ethers.parseEther("60"), ethers.parseEther("40")];

      await splitWise.createExpense(
        groupId,
        await mockToken.getAddress(),
        expenseAmount,
        "Token Expense",
        participants,
        shares
      );

      const balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        await mockToken.getAddress()
      );
      expect(balance).to.equal(ethers.parseEther("40"));
    });

    it("Should update balances correctly for multiple participants", async function () {
      const participants = [
        await owner.getAddress(),
        await user1.getAddress(),
        await user2.getAddress(),
      ];
      const shares = [
        ethers.parseEther("50"),
        ethers.parseEther("30"),
        ethers.parseEther("20"),
      ];

      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        expenseAmount,
        "Shared expense",
        participants,
        shares
      );

      const balance1 = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      const balance2 = await splitWise.getBalance(
        await user2.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      const ownerBalance = await splitWise.getBalance(
        await owner.getAddress(),
        groupId,
        ethers.ZeroAddress
      );

      expect(balance1).to.equal(ethers.parseEther("30"));
      expect(balance2).to.equal(ethers.parseEther("20"));
      expect(ownerBalance).to.equal(ethers.parseEther("-100")); // Negative means owed
    });

    it("Should revert when amount is zero", async function () {
      await expect(
        splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          0,
          "Zero expense",
          [await owner.getAddress()],
          [0]
        )
      ).to.be.revertedWith("SplitWise: amount must be positive");
    });

    it("Should revert when no participants", async function () {
      await expect(
        splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          expenseAmount,
          "No participants",
          [],
          []
        )
      ).to.be.revertedWith("SplitWise: must have at least one participant");
    });

    it("Should revert when shares length doesn't match participants", async function () {
      await expect(
        splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          expenseAmount,
          "Mismatch",
          [await owner.getAddress(), await user1.getAddress()],
          [ethers.parseEther("100")]
        )
      ).to.be.revertedWith("SplitWise: participants and shares length mismatch");
    });

    it("Should revert when participant is not in group", async function () {
      await expect(
        splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          expenseAmount,
          "Invalid participant",
          [await user3.getAddress()],
          [expenseAmount]
        )
      ).to.be.revertedWith("SplitWise: participant not in group");
    });

    it("Should revert when shares don't sum to amount", async function () {
      await expect(
        splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          expenseAmount,
          "Wrong sum",
          [await owner.getAddress(), await user1.getAddress()],
          [ethers.parseEther("60"), ethers.parseEther("50")] // 110 != 100
        )
      ).to.be.revertedWith("SplitWise: shares must sum to amount");
    });

    it("Should handle payer being a participant correctly", async function () {
      const participants = [await owner.getAddress(), await user1.getAddress()];
      const shares = [ethers.parseEther("50"), ethers.parseEther("50")];

      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        expenseAmount,
        "Payer is participant",
        participants,
        shares
      );

      // Payer's balance should only reflect what others owe
      const ownerBalance = await splitWise.getBalance(
        await owner.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(ownerBalance).to.equal(ethers.parseEther("-50")); // Only user1's share
    });
  });
});


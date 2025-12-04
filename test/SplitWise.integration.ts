import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("SplitWise - Integration Tests", function () {
  let splitWise: any;
  let mockToken: any;
  let mockToken2: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;
  let user4: any;

  beforeEach(async function () {
    [owner, user1, user2, user3, user4] = await ethers.getSigners();

    // Deploy contracts
    splitWise = await ethers.deployContract("SplitWise");

    const MockERC20 = await ethers.getContractFactory("MockERC20", owner);
    mockToken = await MockERC20.deploy("Token1", "T1", 18, ethers.parseEther("1000000"));
    mockToken2 = await MockERC20.deploy("Token2", "T2", 18, ethers.parseEther("1000000"));
  });

  describe("Complete Expense Flow", function () {
    it("Should handle full expense cycle: create group, add expense, settle payment", async function () {
      // Step 1: Create group
      const tx1 = await splitWise.createGroup("Vacation Group", [
        await user1.getAddress(),
        await user2.getAddress(),
        await user3.getAddress(),
      ]);
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event1).args.groupId;

      // Verify group
      const group = await splitWise.getGroup(groupId);
      expect(group[3]).to.have.lengthOf(4); // owner + 3 users

      // Step 2: Create expense
      const expenseAmount = ethers.parseEther("300");
      const tx2 = await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        expenseAmount,
        "Hotel booking",
        [
          await owner.getAddress(),
          await user1.getAddress(),
          await user2.getAddress(),
          await user3.getAddress(),
        ],
        [
          ethers.parseEther("75"),
          ethers.parseEther("75"),
          ethers.parseEther("75"),
          ethers.parseEther("75"),
        ]
      );
      const receipt2 = await tx2.wait();

      // Verify balances
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
      const balance3 = await splitWise.getBalance(
        await user3.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      const ownerBalance = await splitWise.getBalance(
        await owner.getAddress(),
        groupId,
        ethers.ZeroAddress
      );

      expect(balance1).to.equal(ethers.parseEther("75"));
      expect(balance2).to.equal(ethers.parseEther("75"));
      expect(balance3).to.equal(ethers.parseEther("75"));
      expect(ownerBalance).to.equal(ethers.parseEther("-225")); // Owner paid, others owe

      // Step 3: Settle payments
      const initialOwnerBalance = await ethers.provider.getBalance(await owner.getAddress());

      // User1 settles
      await splitWise
        .connect(user1)
        .settlePayment(groupId, ethers.ZeroAddress, ethers.parseEther("75"), await owner.getAddress(), {
          value: ethers.parseEther("75"),
        });

      let user1Balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(user1Balance).to.equal(0n);

      // User2 settles
      await splitWise
        .connect(user2)
        .settlePayment(groupId, ethers.ZeroAddress, ethers.parseEther("75"), await owner.getAddress(), {
          value: ethers.parseEther("75"),
        });

      // User3 settles
      await splitWise
        .connect(user3)
        .settlePayment(groupId, ethers.ZeroAddress, ethers.parseEther("75"), await owner.getAddress(), {
          value: ethers.parseEther("75"),
        });

      // Verify all balances are zero
      const finalBalance1 = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      const finalBalance2 = await splitWise.getBalance(
        await user2.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      const finalBalance3 = await splitWise.getBalance(
        await user3.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      const finalOwnerBalance = await splitWise.getBalance(
        await owner.getAddress(),
        groupId,
        ethers.ZeroAddress
      );

      expect(finalBalance1).to.equal(0n);
      expect(finalBalance2).to.equal(0n);
      expect(finalBalance3).to.equal(0n);
      expect(finalOwnerBalance).to.equal(0n);

      // Verify owner received ETH
      const finalOwnerETHBalance = await ethers.provider.getBalance(await owner.getAddress());
      // Note: Balance will be less due to gas costs, but we received 225 ETH
      expect(finalOwnerETHBalance).to.be.greaterThan(initialOwnerBalance);
    });

    it("Should handle multiple expenses and partial settlements", async function () {
      // Create group
      const tx = await splitWise.createGroup("Test Group", [
        await user1.getAddress(),
        await user2.getAddress(),
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

      // Create first expense
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Expense 1",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      // Create second expense
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("50"),
        "Expense 2",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("30"), ethers.parseEther("20")]
      );

      // Check cumulative balance
      let balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(balance).to.equal(ethers.parseEther("60")); // 40 + 20

      // Partial settlement
      await splitWise
        .connect(user1)
        .settlePayment(groupId, ethers.ZeroAddress, ethers.parseEther("30"), await owner.getAddress(), {
          value: ethers.parseEther("30"),
        });

      balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(balance).to.equal(ethers.parseEther("30")); // 60 - 30

      // Full settlement
      await splitWise
        .connect(user1)
        .settlePayment(groupId, ethers.ZeroAddress, ethers.parseEther("30"), await owner.getAddress(), {
          value: ethers.parseEther("30"),
        });

      balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(balance).to.equal(0n);
    });

    it("Should handle multiple tokens in same group", async function () {
      // Create group
      const tx = await splitWise.createGroup("Multi-token Group", [
        await user1.getAddress(),
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

      // Create expense in ETH
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "ETH expense",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      // Create expense in Token1
      await splitWise.createExpense(
        groupId,
        await mockToken.getAddress(),
        ethers.parseEther("200"),
        "Token1 expense",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("120"), ethers.parseEther("80")]
      );

      // Create expense in Token2
      await splitWise.createExpense(
        groupId,
        await mockToken2.getAddress(),
        ethers.parseEther("50"),
        "Token2 expense",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("30"), ethers.parseEther("20")]
      );

      // Check balances for each token
      const ethBalance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      const token1Balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        await mockToken.getAddress()
      );
      const token2Balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        await mockToken2.getAddress()
      );

      expect(ethBalance).to.equal(ethers.parseEther("40"));
      expect(token1Balance).to.equal(ethers.parseEther("80"));
      expect(token2Balance).to.equal(ethers.parseEther("20"));

      // Check total balances
      const totalETH = await splitWise.getTotalBalance(
        await user1.getAddress(),
        ethers.ZeroAddress
      );
      const totalToken1 = await splitWise.getTotalBalance(
        await user1.getAddress(),
        await mockToken.getAddress()
      );
      const totalToken2 = await splitWise.getTotalBalance(
        await user1.getAddress(),
        await mockToken2.getAddress()
      );

      expect(totalETH).to.equal(ethers.parseEther("40"));
      expect(totalToken1).to.equal(ethers.parseEther("80"));
      expect(totalToken2).to.equal(ethers.parseEther("20"));
    });
  });

  describe("Multiple Groups", function () {
    it("Should handle expenses across multiple groups independently", async function () {
      // Create two groups
      const tx1 = await splitWise.createGroup("Group 1", [await user1.getAddress()]);
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId1 = splitWise.interface.parseLog(event1).args.groupId;

      const tx2 = await splitWise.createGroup("Group 2", [await user1.getAddress()]);
      const receipt2 = await tx2.wait();
      const event2 = receipt2.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId2 = splitWise.interface.parseLog(event2).args.groupId;

      // Create expenses in both groups
      await splitWise.createExpense(
        groupId1,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Group 1 expense",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      await splitWise.createExpense(
        groupId2,
        ethers.ZeroAddress,
        ethers.parseEther("200"),
        "Group 2 expense",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("120"), ethers.parseEther("80")]
      );

      // Check balances in each group
      const balance1 = await splitWise.getBalance(
        await user1.getAddress(),
        groupId1,
        ethers.ZeroAddress
      );
      const balance2 = await splitWise.getBalance(
        await user1.getAddress(),
        groupId2,
        ethers.ZeroAddress
      );

      expect(balance1).to.equal(ethers.parseEther("40"));
      expect(balance2).to.equal(ethers.parseEther("80"));

      // Check total balance (should be sum of both groups)
      const totalBalance = await splitWise.getTotalBalance(
        await user1.getAddress(),
        ethers.ZeroAddress
      );
      expect(totalBalance).to.equal(ethers.parseEther("120")); // 40 + 80
    });
  });

  describe("Complex Multi-User Scenarios", function () {
    it("Should handle circular debts correctly", async function () {
      // Create group with 4 users
      const tx = await splitWise.createGroup("Complex Group", [
        await user1.getAddress(),
        await user2.getAddress(),
        await user3.getAddress(),
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

      // User1 pays for expense, split between User1 and User2
      await splitWise.connect(user1).createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Expense by User1",
        [await user1.getAddress(), await user2.getAddress()],
        [ethers.parseEther("50"), ethers.parseEther("50")]
      );

      // User2 pays for expense, split between User2 and User3
      await splitWise.connect(user2).createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Expense by User2",
        [await user2.getAddress(), await user3.getAddress()],
        [ethers.parseEther("50"), ethers.parseEther("50")]
      );

      // User3 pays for expense, split between User3 and Owner
      await splitWise.connect(user3).createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Expense by User3",
        [await user3.getAddress(), await owner.getAddress()],
        [ethers.parseEther("50"), ethers.parseEther("50")]
      );

      // Check balances
      // User1: Paid 50, owed 50, net = 0
      // User2: Paid 50, owed 100 (50 to User1 + 50 to User3), net = +50
      // User3: Paid 50, owed 50, net = 0
      // Owner: Owed 50, net = -50

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
      const balance3 = await splitWise.getBalance(
        await user3.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      const ownerBalance = await splitWise.getBalance(
        await owner.getAddress(),
        groupId,
        ethers.ZeroAddress
      );

      expect(balance1).to.equal(0n); // User1 owes nothing
      expect(balance2).to.equal(ethers.parseEther("50")); // User2 owes 50
      expect(balance3).to.equal(0n); // User3 owes nothing
      expect(ownerBalance).to.equal(ethers.parseEther("-50")); // Owner is owed 50
    });

    it("Should handle adding members and creating expenses", async function () {
      // Create group with initial members
      const tx = await splitWise.createGroup("Growing Group", [
        await user1.getAddress(),
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

      // Create expense with initial members
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Initial expense",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      // Add new member
      await splitWise.addMember(groupId, await user2.getAddress());

      // Create expense with new member included
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("150"),
        "Expense with new member",
        [await owner.getAddress(), await user1.getAddress(), await user2.getAddress()],
        [
          ethers.parseEther("50"),
          ethers.parseEther("50"),
          ethers.parseEther("50"),
        ]
      );

      // Check balances
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

      expect(balance1).to.equal(ethers.parseEther("90")); // 40 + 50
      expect(balance2).to.equal(ethers.parseEther("50")); // Only from second expense
    });
  });

  describe("Cross-Token Settlement", function () {
    it("Should handle cross-token payment settlement", async function () {
      // Create group
      const tx = await splitWise.createGroup("Cross-Token Group", [
        await user1.getAddress(),
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

      // Create expense in Token1
      await splitWise.createExpense(
        groupId,
        await mockToken.getAddress(),
        ethers.parseEther("100"),
        "Token1 expense",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      // Check balance
      let balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        await mockToken.getAddress()
      );
      expect(balance).to.equal(ethers.parseEther("40"));

      // Settle using Token2 (cross-token settlement)
      await mockToken2.mint(await user1.getAddress(), ethers.parseEther("100"));
      await mockToken2.connect(user1).approve(await splitWise.getAddress(), ethers.parseEther("100"));

      // 1:1 conversion rate (1e18 = 1:1)
      const conversionRate = ethers.parseEther("1");

      await splitWise
        .connect(user1)
        .settlePaymentCrossToken(
          groupId,
          await mockToken.getAddress(), // owed token
          await mockToken2.getAddress(), // payment token
          ethers.parseEther("40"), // owed amount
          ethers.parseEther("40"), // payment amount
          await owner.getAddress(),
          conversionRate
        );

      // Check balances
      balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        await mockToken.getAddress()
      );
      expect(balance).to.equal(0n); // Token1 balance cleared

      // Owner should have received Token2
      const ownerToken2Balance = await mockToken2.balanceOf(await owner.getAddress());
      expect(ownerToken2Balance).to.equal(ethers.parseEther("40"));
    });

    it("Should revert cross-token settlement with invalid conversion rate", async function () {
      // Create group and expense
      const tx = await splitWise.createGroup("Test Group", [await user1.getAddress()]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

      await splitWise.createExpense(
        groupId,
        await mockToken.getAddress(),
        ethers.parseEther("100"),
        "Test expense",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      await mockToken2.mint(await user1.getAddress(), ethers.parseEther("100"));
      await mockToken2.connect(user1).approve(await splitWise.getAddress(), ethers.parseEther("100"));

      // Try to settle with wrong conversion rate (way off)
      await expect(
        splitWise
          .connect(user1)
          .settlePaymentCrossToken(
            groupId,
            await mockToken.getAddress(),
            await mockToken2.getAddress(),
            ethers.parseEther("40"),
            ethers.parseEther("40"),
            await owner.getAddress(),
            ethers.parseEther("0.5") // 50% rate - should fail
          )
      ).to.be.revertedWith("SplitWise: conversion rate mismatch");
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle refund of excess ETH correctly", async function () {
      // Create group and expense
      const tx = await splitWise.createGroup("Test Group", [await user1.getAddress()]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Test",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      const initialBalance = await ethers.provider.getBalance(await user1.getAddress());

      // Send excess ETH
      const excessAmount = ethers.parseEther("10");
      const settlementAmount = ethers.parseEther("40");
      const totalSent = settlementAmount + excessAmount;

      const tx2 = await splitWise
        .connect(user1)
        .settlePayment(groupId, ethers.ZeroAddress, settlementAmount, await owner.getAddress(), {
          value: totalSent,
        });
      const receipt2 = await tx2.wait();

      // Calculate gas cost
      const gasUsed = BigInt(receipt2.gasUsed.toString()) * receipt2.gasPrice;

      // Check final balance (should have excess refunded, minus gas)
      const finalBalance = await ethers.provider.getBalance(await user1.getAddress());
      const expectedBalance = initialBalance - totalSent - gasUsed + excessAmount;

      // Allow small tolerance for gas estimation differences
      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });
  });
});


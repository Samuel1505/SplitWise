import { expect } from "chai";
import { network } from "hardhat";
import { setupIntegrationTests, getGroupIdFromEvent } from "./fixtures.js";

const { ethers } = await network.connect();

describe("SplitWise - Integration Tests: Complex Multi-User Scenarios", function () {
  let splitWise: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async function () {
    const setup = await setupIntegrationTests();
    splitWise = setup.splitWise;
    owner = setup.owner;
    user1 = setup.user1;
    user2 = setup.user2;
    user3 = setup.user3;
  });

  it("Should handle circular debts correctly", async function () {
    // Create group with 4 users
    const tx = await splitWise.createGroup("Complex Group", [
      await user1.getAddress(),
      await user2.getAddress(),
      await user3.getAddress(),
    ]);
    const receipt = await tx.wait();
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

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
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

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


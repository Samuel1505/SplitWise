import { expect } from "chai";
import { network } from "hardhat";
import { setupIntegrationTests, getGroupIdFromEvent } from "./fixtures.js";

const { ethers } = await network.connect();

describe("SplitWise - Integration Tests: Cross-Token Settlement", function () {
  let splitWise: any;
  let mockToken: any;
  let mockToken2: any;
  let owner: any;
  let user1: any;

  beforeEach(async function () {
    const setup = await setupIntegrationTests();
    splitWise = setup.splitWise;
    mockToken = setup.mockToken;
    mockToken2 = setup.mockToken2;
    owner = setup.owner;
    user1 = setup.user1;
  });

  it("Should handle cross-token payment settlement", async function () {
    // Create group
    const tx = await splitWise.createGroup("Cross-Token Group", [
      await user1.getAddress(),
    ]);
    const receipt = await tx.wait();
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

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
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

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


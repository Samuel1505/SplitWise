import { expect } from "chai";
import { network } from "hardhat";
import {
  setupFuzzTests,
  getGroupIdFromEvent,
  randomBigInt,
} from "./helpers.js";

const { ethers } = await network.connect();

describe("SplitWise - Fuzz Tests: Edge Cases", function () {
  let splitWise: any;
  let accounts: any[];

  beforeEach(async function () {
    const setup = await setupFuzzTests();
    splitWise = setup.splitWise;
    accounts = setup.accounts;
  });

  it("Should handle very large amounts", async function () {
    const tx = await splitWise.createGroup("Large Amount Group", [
      await accounts[1].getAddress(),
    ]);
    const receipt = await tx.wait();
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

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
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

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
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

    let expectedBalance = 0n;

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


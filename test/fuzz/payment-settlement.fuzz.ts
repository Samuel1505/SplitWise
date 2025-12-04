import { expect } from "chai";
import { network } from "hardhat";
import {
  setupFuzzTests,
  getGroupIdFromEvent,
  NUM_FUZZ_RUNS,
  randomBigInt,
} from "./helpers.js";

const { ethers } = await network.connect();

describe("SplitWise - Fuzz Tests: Payment Settlement", function () {
  let splitWise: any;
  let accounts: any[];

  beforeEach(async function () {
    const setup = await setupFuzzTests();
    splitWise = setup.splitWise;
    accounts = setup.accounts;
  });

  it("Should correctly settle payments with random amounts", async function () {
    const tx = await splitWise.createGroup("Settlement Fuzz Group", [
      await accounts[1].getAddress(),
      await accounts[2].getAddress(),
    ]);
    const receipt = await tx.wait();
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

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

      expect(balanceBefore - balanceAfter).to.equal(settlementAmount);
      remainingBalance = balanceAfter;
    }

    const finalBalance = await splitWise.getBalance(
      await payer.getAddress(),
      groupId,
      ethers.ZeroAddress
    );
    expect(finalBalance).to.be.greaterThanOrEqual(0n);
  });
});


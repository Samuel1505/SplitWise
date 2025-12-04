import { expect } from "chai";
import { network } from "hardhat";
import { setupUnitTests, getGroupIdFromEvent } from "./fixtures";

const { ethers } = await network.connect();

describe("SplitWise - Unit Tests: Balance Queries", function () {
  let splitWise: any;
  let owner: any;
  let user1: any;
  let groupId: bigint;

  beforeEach(async function () {
    const setup = await setupUnitTests();
    splitWise = setup.splitWise;
    owner = setup.owner;
    user1 = setup.user1;

    const tx = await splitWise.createGroup("Test Group", [await user1.getAddress()]);
    const receipt = await tx.wait();
    groupId = await getGroupIdFromEvent(splitWise, receipt);
  });

  describe("getBalance and getTotalBalance", function () {
    it("Should return correct balance for user in group", async function () {
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Test",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      const balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(balance).to.equal(ethers.parseEther("40"));
    });

    it("Should return zero balance when no expenses", async function () {
      const balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(balance).to.equal(0n);
    });

    it("Should return correct total balance across groups", async function () {
      // Create second group
      const tx2 = await splitWise.createGroup("Group 2", [await user1.getAddress()]);
      const receipt2 = await tx2.wait();
      const groupId2 = await getGroupIdFromEvent(splitWise, receipt2);

      // Create expenses in both groups
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Expense 1",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      await splitWise.createExpense(
        groupId2,
        ethers.ZeroAddress,
        ethers.parseEther("50"),
        "Expense 2",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("30"), ethers.parseEther("20")]
      );

      const totalBalance = await splitWise.getTotalBalance(
        await user1.getAddress(),
        ethers.ZeroAddress
      );
      expect(totalBalance).to.equal(ethers.parseEther("60")); // 40 + 20
    });
  });
});


import { expect } from "chai";
import { network } from "hardhat";
import { setupUnitTests, getGroupIdFromEvent } from "./fixtures.js";

const { ethers } = await network.connect();

describe("SplitWise - Unit Tests: Data Retrieval", function () {
  let splitWise: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let groupId: bigint;

  beforeEach(async function () {
    const setup = await setupUnitTests();
    splitWise = setup.splitWise;
    owner = setup.owner;
    user1 = setup.user1;
    user2 = setup.user2;

    const tx = await splitWise.createGroup("Test Group", [await user1.getAddress()]);
    const receipt = await tx.wait();
    groupId = await getGroupIdFromEvent(splitWise, receipt);
  });

  describe("getGroup and getExpense", function () {
    it("Should return correct group information", async function () {
      const tx = await splitWise.createGroup("My Group", [
        await user1.getAddress(),
        await user2.getAddress(),
      ]);
      const receipt = await tx.wait();
      const testGroupId = await getGroupIdFromEvent(splitWise, receipt);

      const group = await splitWise.getGroup(testGroupId);
      expect(group[0]).to.equal(testGroupId);
      expect(group[1]).to.equal("My Group");
      expect(group[2]).to.equal(await owner.getAddress());
      expect(group[3]).to.have.lengthOf(3); // creator + 2 members
      expect(group[4]).to.be.greaterThan(0n);
    });

    it("Should return correct expense information", async function () {
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Dinner expense",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      const expense = await splitWise.getExpense(1);
      expect(expense[0]).to.equal(1n); // id
      expect(expense[1]).to.equal(groupId);
      expect(expense[2]).to.equal(await owner.getAddress()); // payer
      expect(expense[3]).to.equal(ethers.ZeroAddress); // token
      expect(expense[4]).to.equal(ethers.parseEther("100")); // amount
      expect(expense[5]).to.equal("Dinner expense"); // description
      expect(expense[6]).to.have.lengthOf(2); // participants
      expect(expense[7]).to.equal(false); // settled
      expect(expense[8]).to.be.greaterThan(0n); // createdAt
    });

    it("Should revert when querying non-existent group", async function () {
      await expect(splitWise.getGroup(999)).to.be.revertedWith("SplitWise: group does not exist");
    });

    it("Should revert when querying non-existent expense", async function () {
      await expect(splitWise.getExpense(999)).to.be.revertedWith("SplitWise: expense does not exist");
    });
  });

  describe("getExpenseShare", function () {
    it("Should return correct share for participant", async function () {
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Test",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      const share1 = await splitWise.getExpenseShare(1, await owner.getAddress());
      const share2 = await splitWise.getExpenseShare(1, await user1.getAddress());

      expect(share1).to.equal(ethers.parseEther("60"));
      expect(share2).to.equal(ethers.parseEther("40"));
    });

    it("Should return zero for non-participant", async function () {
      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        ethers.parseEther("100"),
        "Test",
        [await owner.getAddress()],
        [ethers.parseEther("100")]
      );

      const share = await splitWise.getExpenseShare(1, await user1.getAddress());
      expect(share).to.equal(0n);
    });
  });
});


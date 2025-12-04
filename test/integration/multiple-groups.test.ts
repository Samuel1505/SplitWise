import { expect } from "chai";
import { network } from "hardhat";
import { setupIntegrationTests, getGroupIdFromEvent } from "./fixtures";

const { ethers } = await network.connect();

describe("SplitWise - Integration Tests: Multiple Groups", function () {
  let splitWise: any;
  let owner: any;
  let user1: any;

  beforeEach(async function () {
    const setup = await setupIntegrationTests();
    splitWise = setup.splitWise;
    owner = setup.owner;
    user1 = setup.user1;
  });

  it("Should handle expenses across multiple groups independently", async function () {
    // Create two groups
    const tx1 = await splitWise.createGroup("Group 1", [await user1.getAddress()]);
    const receipt1 = await tx1.wait();
    const groupId1 = await getGroupIdFromEvent(splitWise, receipt1);

    const tx2 = await splitWise.createGroup("Group 2", [await user1.getAddress()]);
    const receipt2 = await tx2.wait();
    const groupId2 = await getGroupIdFromEvent(splitWise, receipt2);

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


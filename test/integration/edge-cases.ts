import { expect } from "chai";
import { network } from "hardhat";
import { setupIntegrationTests, getGroupIdFromEvent } from "./fixtures.js";

const { ethers } = await network.connect();

describe("SplitWise - Integration Tests: Edge Cases and Error Handling", function () {
  let splitWise: any;
  let owner: any;
  let user1: any;

  beforeEach(async function () {
    const setup = await setupIntegrationTests();
    splitWise = setup.splitWise;
    owner = setup.owner;
    user1 = setup.user1;
  });

  it("Should handle refund of excess ETH correctly", async function () {
    // Create group and expense
    const tx = await splitWise.createGroup("Test Group", [await user1.getAddress()]);
    const receipt = await tx.wait();
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

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


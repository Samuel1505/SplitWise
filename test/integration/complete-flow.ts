import { expect } from "chai";
import { network } from "hardhat";
import { setupIntegrationTests, getGroupIdFromEvent } from "./fixtures.js";

const { ethers } = await network.connect();

describe("SplitWise - Integration Tests: Complete Expense Flow", function () {
  let splitWise: any;
  let mockToken: any;
  let mockToken2: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async function () {
    const setup = await setupIntegrationTests();
    splitWise = setup.splitWise;
    mockToken = setup.mockToken;
    mockToken2 = setup.mockToken2;
    owner = setup.owner;
    user1 = setup.user1;
    user2 = setup.user2;
    user3 = setup.user3;
  });

  it("Should handle full expense cycle: create group, add expense, settle payment", async function () {
    // Step 1: Create group
    const tx1 = await splitWise.createGroup("Vacation Group", [
      await user1.getAddress(),
      await user2.getAddress(),
      await user3.getAddress(),
    ]);
    const receipt1 = await tx1.wait();
    const groupId = await getGroupIdFromEvent(splitWise, receipt1);

    // Verify group
    const group = await splitWise.getGroup(groupId);
    expect(group[3]).to.have.lengthOf(4); // owner + 3 users

    // Step 2: Create expense
    const expenseAmount = ethers.parseEther("300");
    await splitWise.createExpense(
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
    expect(finalOwnerETHBalance).to.be.greaterThan(initialOwnerBalance);
  });

  it("Should handle multiple expenses and partial settlements", async function () {
    // Create group
    const tx = await splitWise.createGroup("Test Group", [
      await user1.getAddress(),
      await user2.getAddress(),
    ]);
    const receipt = await tx.wait();
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

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
    const groupId = await getGroupIdFromEvent(splitWise, receipt);

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


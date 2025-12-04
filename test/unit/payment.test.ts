import { expect } from "chai";
import { network } from "hardhat";
import { setupUnitTests, getGroupIdFromEvent } from "./fixtures.js";

const { ethers } = await network.connect();

describe("SplitWise - Unit Tests: Payment Settlement", function () {
  let splitWise: any;
  let mockToken: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let groupId: bigint;
  const expenseAmount = ethers.parseEther("100");

  beforeEach(async function () {
    const setup = await setupUnitTests();
    splitWise = setup.splitWise;
    mockToken = setup.mockToken;
    owner = setup.owner;
    user1 = setup.user1;
    user2 = setup.user2;

    const tx = await splitWise.createGroup("Test Group", [
      await user1.getAddress(),
      await user2.getAddress(),
    ]);
    const receipt = await tx.wait();
    groupId = await getGroupIdFromEvent(splitWise, receipt);

    // Create an expense where user1 owes owner
    await splitWise.createExpense(
      groupId,
      ethers.ZeroAddress,
      expenseAmount,
      "Test expense",
      [await owner.getAddress(), await user1.getAddress()],
      [ethers.parseEther("60"), ethers.parseEther("40")]
    );
  });

  describe("settlePayment", function () {
    it("Should settle payment with native ETH", async function () {
      const settlementAmount = ethers.parseEther("40");
      const initialBalance = await ethers.provider.getBalance(await owner.getAddress());

      const tx = await splitWise
        .connect(user1)
        .settlePayment(groupId, ethers.ZeroAddress, settlementAmount, await owner.getAddress(), {
          value: settlementAmount,
        });
      const receipt = await tx.wait();

      // Check event
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "PaymentSettled";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;

      // Check balances
      const user1Balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(user1Balance).to.equal(0n);

      // Check ETH was transferred
      const finalBalance = await ethers.provider.getBalance(await owner.getAddress());
      expect(finalBalance - initialBalance).to.equal(settlementAmount);
    });

    it("Should settle payment with ERC20 token", async function () {
      // Create token expense
      await splitWise.createExpense(
        groupId,
        await mockToken.getAddress(),
        expenseAmount,
        "Token expense",
        [await owner.getAddress(), await user1.getAddress()],
        [ethers.parseEther("60"), ethers.parseEther("40")]
      );

      // Mint and approve tokens
      await mockToken.mint(await user1.getAddress(), ethers.parseEther("100"));
      await mockToken.connect(user1).approve(await splitWise.getAddress(), ethers.parseEther("100"));

      const settlementAmount = ethers.parseEther("40");
      await splitWise
        .connect(user1)
        .settlePayment(
          groupId,
          await mockToken.getAddress(),
          settlementAmount,
          await owner.getAddress()
        );

      // Check balances
      const user1Balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        await mockToken.getAddress()
      );
      expect(user1Balance).to.equal(0n);

      // Check token balance
      expect(await mockToken.balanceOf(await owner.getAddress())).to.equal(settlementAmount);
    });

    it("Should revert when amount is zero", async function () {
      await expect(
        splitWise
          .connect(user1)
          .settlePayment(groupId, ethers.ZeroAddress, 0, await owner.getAddress())
      ).to.be.revertedWith("SplitWise: amount must be positive");
    });

    it("Should revert when recipient is zero address", async function () {
      await expect(
        splitWise
          .connect(user1)
          .settlePayment(groupId, ethers.ZeroAddress, ethers.parseEther("40"), ethers.ZeroAddress, {
            value: ethers.parseEther("40"),
          })
      ).to.be.revertedWith("SplitWise: invalid recipient");
    });

    it("Should revert when trying to pay yourself", async function () {
      await expect(
        splitWise
          .connect(user1)
          .settlePayment(
            groupId,
            ethers.ZeroAddress,
            ethers.parseEther("40"),
            await user1.getAddress(),
            { value: ethers.parseEther("40") }
          )
      ).to.be.revertedWith("SplitWise: cannot pay yourself");
    });

    it("Should revert when no balance to settle", async function () {
      await expect(
        splitWise
          .connect(user2)
          .settlePayment(groupId, ethers.ZeroAddress, ethers.parseEther("10"), await owner.getAddress(), {
            value: ethers.parseEther("10"),
          })
      ).to.be.revertedWith("SplitWise: no balance to settle");
    });

    it("Should revert when settlement amount exceeds balance", async function () {
      await expect(
        splitWise
          .connect(user1)
          .settlePayment(groupId, ethers.ZeroAddress, ethers.parseEther("50"), await owner.getAddress(), {
            value: ethers.parseEther("50"),
          })
      ).to.be.revertedWith("SplitWise: insufficient balance");
    });

    it("Should revert when insufficient ETH sent", async function () {
      await expect(
        splitWise
          .connect(user1)
          .settlePayment(groupId, ethers.ZeroAddress, ethers.parseEther("40"), await owner.getAddress(), {
            value: ethers.parseEther("30"),
          })
      ).to.be.revertedWith("SplitWise: insufficient ETH sent");
    });
  });
});


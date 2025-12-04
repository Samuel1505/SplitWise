import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("SplitWise - Unit Tests", function () {
  let splitWise: any;
  let mockToken: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;
  let users: any[];

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    users = [user1, user2, user3];

    // Deploy SplitWise contract
    splitWise = await ethers.deployContract("SplitWise");

    // Deploy mock ERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20", owner);
    mockToken = await MockERC20.deploy(
      "Test Token",
      "TEST",
      18,
      ethers.parseEther("1000000")
    );
  });

  describe("createGroup", function () {
    it("Should create a group with valid parameters", async function () {
      const groupName = "Test Group";
      const members = [await user1.getAddress(), await user2.getAddress()];

      const tx = await splitWise.createGroup(groupName, members);
      const receipt = await tx.wait();

      // Check event
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;

      const parsedEvent = splitWise.interface.parseLog(event);
      expect(parsedEvent.args.groupId).to.equal(1n);
      expect(parsedEvent.args.creator).to.equal(await owner.getAddress());
      expect(parsedEvent.args.name).to.equal(groupName);

      // Verify group data
      const group = await splitWise.getGroup(1);
      expect(group[0]).to.equal(1n); // id
      expect(group[1]).to.equal(groupName);
      expect(group[2]).to.equal(await owner.getAddress()); // creator
      expect(group[3]).to.have.lengthOf(3); // creator + 2 members
      expect(group[4]).to.be.greaterThan(0n); // createdAt
    });

    it("Should revert when group name is empty", async function () {
      await expect(
        splitWise.createGroup("", [await user1.getAddress()])
      ).to.be.revertedWith("SplitWise: group name required");
    });

    it("Should revert when member address is zero", async function () {
      await expect(
        splitWise.createGroup("Test Group", [ethers.ZeroAddress])
      ).to.be.revertedWith("SplitWise: invalid member address");
    });

    it("Should revert when duplicate member is added", async function () {
      const members = [await user1.getAddress(), await user1.getAddress()];
      await expect(
        splitWise.createGroup("Test Group", members)
      ).to.be.revertedWith("SplitWise: duplicate member");
    });

    it("Should revert when creator is included in members array", async function () {
      const members = [await owner.getAddress(), await user1.getAddress()];
      await expect(
        splitWise.createGroup("Test Group", members)
      ).to.be.revertedWith("SplitWise: creator already added");
    });

    it("Should create multiple groups with unique IDs", async function () {
      await splitWise.createGroup("Group 1", [await user1.getAddress()]);
      await splitWise.createGroup("Group 2", [await user2.getAddress()]);

      const group1 = await splitWise.getGroup(1);
      const group2 = await splitWise.getGroup(2);

      expect(group1[0]).to.equal(1n);
      expect(group2[0]).to.equal(2n);
      expect(group1[1]).to.equal("Group 1");
      expect(group2[1]).to.equal("Group 2");
    });
  });

  describe("addMember", function () {
    let groupId: bigint;

    beforeEach(async function () {
      const tx = await splitWise.createGroup("Test Group", [await user1.getAddress()]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      groupId = splitWise.interface.parseLog(event).args.groupId;
    });

    it("Should add a member to existing group", async function () {
      await expect(splitWise.addMember(groupId, await user2.getAddress()))
        .to.emit(splitWise, "MemberAdded")
        .withArgs(groupId, await user2.getAddress());

      const group = await splitWise.getGroup(groupId);
      expect(group[3]).to.include(await user2.getAddress());
    });

    it("Should revert when group doesn't exist", async function () {
      await expect(
        splitWise.addMember(999, await user2.getAddress())
      ).to.be.revertedWith("SplitWise: group does not exist");
    });

    it("Should revert when caller is not a group member", async function () {
      await expect(
        splitWise.connect(user2).addMember(groupId, await user3.getAddress())
      ).to.be.revertedWith("SplitWise: not a group member");
    });

    it("Should revert when member address is zero", async function () {
      await expect(
        splitWise.addMember(groupId, ethers.ZeroAddress)
      ).to.be.revertedWith("SplitWise: invalid member address");
    });

    it("Should revert when member already exists", async function () {
      await expect(
        splitWise.addMember(groupId, await user1.getAddress())
      ).to.be.revertedWith("SplitWise: member already in group");
    });
  });

  describe("createExpense", function () {
    let groupId: bigint;
    const expenseAmount = ethers.parseEther("100");

    beforeEach(async function () {
      const tx = await splitWise.createGroup("Test Group", [
        await user1.getAddress(),
        await user2.getAddress(),
      ]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      groupId = splitWise.interface.parseLog(event).args.groupId;
    });

    it("Should create expense with native ETH", async function () {
      const participants = [await owner.getAddress(), await user1.getAddress()];
      const shares = [ethers.parseEther("60"), ethers.parseEther("40")];

      const tx = await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress, // ETH
        expenseAmount,
        "Dinner",
        participants,
        shares
      );
      const receipt = await tx.wait();

      // Check event
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "ExpenseCreated";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;

      const parsedEvent = splitWise.interface.parseLog(event);
      expect(parsedEvent.args.expenseId).to.equal(1n);
      expect(parsedEvent.args.groupId).to.equal(groupId);
      expect(parsedEvent.args.payer).to.equal(await owner.getAddress());
      expect(parsedEvent.args.amount).to.equal(expenseAmount);

      // Check balances
      const balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(balance).to.equal(ethers.parseEther("40"));
    });

    it("Should create expense with ERC20 token", async function () {
      const participants = [await owner.getAddress(), await user1.getAddress()];
      const shares = [ethers.parseEther("60"), ethers.parseEther("40")];

      await splitWise.createExpense(
        groupId,
        await mockToken.getAddress(),
        expenseAmount,
        "Token Expense",
        participants,
        shares
      );

      const balance = await splitWise.getBalance(
        await user1.getAddress(),
        groupId,
        await mockToken.getAddress()
      );
      expect(balance).to.equal(ethers.parseEther("40"));
    });

    it("Should update balances correctly for multiple participants", async function () {
      const participants = [
        await owner.getAddress(),
        await user1.getAddress(),
        await user2.getAddress(),
      ];
      const shares = [
        ethers.parseEther("50"),
        ethers.parseEther("30"),
        ethers.parseEther("20"),
      ];

      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        expenseAmount,
        "Shared expense",
        participants,
        shares
      );

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
      const ownerBalance = await splitWise.getBalance(
        await owner.getAddress(),
        groupId,
        ethers.ZeroAddress
      );

      expect(balance1).to.equal(ethers.parseEther("30"));
      expect(balance2).to.equal(ethers.parseEther("20"));
      expect(ownerBalance).to.equal(ethers.parseEther("-100")); // Negative means owed
    });

    it("Should revert when amount is zero", async function () {
      await expect(
        splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          0,
          "Zero expense",
          [await owner.getAddress()],
          [0]
        )
      ).to.be.revertedWith("SplitWise: amount must be positive");
    });

    it("Should revert when no participants", async function () {
      await expect(
        splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          expenseAmount,
          "No participants",
          [],
          []
        )
      ).to.be.revertedWith("SplitWise: must have at least one participant");
    });

    it("Should revert when shares length doesn't match participants", async function () {
      await expect(
        splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          expenseAmount,
          "Mismatch",
          [await owner.getAddress(), await user1.getAddress()],
          [ethers.parseEther("100")]
        )
      ).to.be.revertedWith("SplitWise: participants and shares length mismatch");
    });

    it("Should revert when participant is not in group", async function () {
      await expect(
        splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          expenseAmount,
          "Invalid participant",
          [await user3.getAddress()],
          [expenseAmount]
        )
      ).to.be.revertedWith("SplitWise: participant not in group");
    });

    it("Should revert when shares don't sum to amount", async function () {
      await expect(
        splitWise.createExpense(
          groupId,
          ethers.ZeroAddress,
          expenseAmount,
          "Wrong sum",
          [await owner.getAddress(), await user1.getAddress()],
          [ethers.parseEther("60"), ethers.parseEther("50")] // 110 != 100
        )
      ).to.be.revertedWith("SplitWise: shares must sum to amount");
    });

    it("Should handle payer being a participant correctly", async function () {
      const participants = [await owner.getAddress(), await user1.getAddress()];
      const shares = [ethers.parseEther("50"), ethers.parseEther("50")];

      await splitWise.createExpense(
        groupId,
        ethers.ZeroAddress,
        expenseAmount,
        "Payer is participant",
        participants,
        shares
      );

      // Payer's balance should only reflect what others owe
      const ownerBalance = await splitWise.getBalance(
        await owner.getAddress(),
        groupId,
        ethers.ZeroAddress
      );
      expect(ownerBalance).to.equal(ethers.parseEther("-50")); // Only user1's share
    });
  });

  describe("settlePayment", function () {
    let groupId: bigint;
    const expenseAmount = ethers.parseEther("100");

    beforeEach(async function () {
      const tx = await splitWise.createGroup("Test Group", [
        await user1.getAddress(),
        await user2.getAddress(),
      ]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      groupId = splitWise.interface.parseLog(event).args.groupId;

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

  describe("getBalance and getTotalBalance", function () {
    let groupId: bigint;

    beforeEach(async function () {
      const tx = await splitWise.createGroup("Test Group", [await user1.getAddress()]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      groupId = splitWise.interface.parseLog(event).args.groupId;
    });

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
      const event2 = receipt2.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId2 = splitWise.interface.parseLog(event2).args.groupId;

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

  describe("getGroup and getExpense", function () {
    it("Should return correct group information", async function () {
      const tx = await splitWise.createGroup("My Group", [
        await user1.getAddress(),
        await user2.getAddress(),
      ]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

      const group = await splitWise.getGroup(groupId);
      expect(group[0]).to.equal(groupId);
      expect(group[1]).to.equal("My Group");
      expect(group[2]).to.equal(await owner.getAddress());
      expect(group[3]).to.have.lengthOf(3); // creator + 2 members
      expect(group[4]).to.be.greaterThan(0n);
    });

    it("Should return correct expense information", async function () {
      const tx = await splitWise.createGroup("Test Group", [await user1.getAddress()]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      const groupId = splitWise.interface.parseLog(event).args.groupId;

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
    let groupId: bigint;

    beforeEach(async function () {
      const tx = await splitWise.createGroup("Test Group", [await user1.getAddress()]);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          return splitWise.interface.parseLog(log).name === "GroupCreated";
        } catch {
          return false;
        }
      });
      groupId = splitWise.interface.parseLog(event).args.groupId;
    });

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


import { expect } from "chai";
import { network } from "hardhat";
import { setupUnitTests, getGroupIdFromEvent } from "./fixtures.js";

const { ethers } = await network.connect();

describe("SplitWise - Unit Tests: Group Management", function () {
  let splitWise: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async function () {
    const setup = await setupUnitTests();
    splitWise = setup.splitWise;
    owner = setup.owner;
    user1 = setup.user1;
    user2 = setup.user2;
    user3 = setup.user3;
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
      groupId = await getGroupIdFromEvent(splitWise, receipt);
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
});


import { expect } from "chai";
import { network } from "hardhat";
import {
  setupFuzzTests,
  getGroupIdFromEvent,
  NUM_FUZZ_RUNS,
} from "./helpers.js";

const { ethers } = await network.connect();

describe("SplitWise - Fuzz Tests: Group Creation", function () {
  let splitWise: any;
  let accounts: any[];

  beforeEach(async function () {
    const setup = await setupFuzzTests();
    splitWise = setup.splitWise;
    accounts = setup.accounts;
  });

  it("Should always create valid groups with random names and members", async function () {
    for (let i = 0; i < NUM_FUZZ_RUNS; i++) {
      const numMembers = Math.floor(Math.random() * 10) + 1; // 1-10 members
      const memberAddresses = [];

      // Select random unique members
      const selectedIndices = new Set<number>();
      while (selectedIndices.size < numMembers && selectedIndices.size < accounts.length - 1) {
        const idx = Math.floor(Math.random() * (accounts.length - 1)) + 1;
        selectedIndices.add(idx);
      }

      for (const idx of selectedIndices) {
        memberAddresses.push(await accounts[idx].getAddress());
      }

      const groupName = `Group ${Math.random().toString(36).substring(7)}`;

      const tx = await splitWise.createGroup(groupName, memberAddresses);
      const receipt = await tx.wait();
      const groupId = await getGroupIdFromEvent(splitWise, receipt);

      // Verify group exists
      const group = await splitWise.getGroup(groupId);
      expect(group[0]).to.equal(groupId);
      expect(group[1]).to.equal(groupName);
      expect(group[3].length).to.equal(memberAddresses.length + 1); // +1 for creator
    }
  });
});


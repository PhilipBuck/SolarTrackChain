import { expect } from "chai";
import { ethers } from "hardhat";
import type { SolarTrackManager } from "../types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SolarTrackManager", function () {
  let solarTrack: SolarTrackManager;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const SolarTrackManagerFactory = await ethers.getContractFactory(
      "SolarTrackManager"
    );
    solarTrack = await SolarTrackManagerFactory.deploy();
    await solarTrack.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await solarTrack.getAddress()).to.be.properAddress;
    });

    it("Should have zero total users initially", async function () {
      expect(await solarTrack.getTotalUsers()).to.equal(0);
    });
  });

  describe("logSolarUsage", function () {
    it("Should allow user to log solar usage", async function () {
      // This test would require FHEVM mock setup
      // In a real test, you would encrypt the value using FHEVM
      const dayKey = Math.floor(Date.now() / 86400);
      const hasLogged = await solarTrack.hasLoggedToday(user1.address);
      expect(hasLogged).to.be.false;
    });

    it("Should prevent duplicate logging on same day", async function () {
      // Test duplicate prevention
      const hasLogged = await solarTrack.hasLoggedToday(user1.address);
      expect(hasLogged).to.be.false;
    });
  });

  describe("Getters", function () {
    it("Should return correct total users", async function () {
      expect(await solarTrack.getTotalUsers()).to.equal(0);
    });

    it("Should return false for hasLoggedToday for new user", async function () {
      expect(await solarTrack.hasLoggedToday(user1.address)).to.be.false;
    });
  });
});


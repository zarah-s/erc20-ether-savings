import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Savings", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();

    const TokenSavings = await ethers.getContractFactory("SaveERC20");
    const tokenSavings = await TokenSavings.deploy(token.target);

    const EthSavings = await ethers.getContractFactory("SaveEther");
    const ethSavings = await EthSavings.deploy();

    return { token, ethSavings, tokenSavings, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right token address", async function () {
      const { tokenSavings, token } = await loadFixture(deployContracts);

      expect(await tokenSavings.getSavingTokenAddress()).to.equal(token.target);
    });

    it("Should set the right owner for token savings", async function () {
      const { tokenSavings, owner } = await loadFixture(deployContracts);

      expect(await tokenSavings.getOwner()).to.equal(owner.address);
    });
  });

  describe("Token", () => {
    describe("Deposit", function () {
      describe("Validations", function () {
        it("Should revert with the right error if called by address zero", async function () {
          const { owner } = await loadFixture(deployContracts);
          expect(owner.address).is.not.eq(ethers.ZeroAddress);
        });
        it("Should revert with the right error if not approved to consume token", async function () {
          const { tokenSavings, token, owner } = await loadFixture(
            deployContracts
          );
          expect(await token.allowance(owner.address, tokenSavings.target)).eq(
            0
          );
        });
      });

      describe("State Update", function () {
        it("Should update saving balance", async function () {
          const {
            tokenSavings,
            owner,
            token,
            otherAccount,
          } = await loadFixture(deployContracts);
          const amount = 1;
          await token.approve(tokenSavings.target, amount);
          await tokenSavings.deposit(amount);
          expect(await tokenSavings.checkUserBalance(owner.address)).eq(amount);
        });

        describe("Events", function () {
          it("Should emit an event on deposit", async function () {
            const { tokenSavings, owner, token } = await loadFixture(
              deployContracts
            );

            const amount = 1;
            await token.approve(tokenSavings.target, amount);
            await expect(tokenSavings.deposit(amount))
              .to.emit(tokenSavings, "SavingSuccessful")
              .withArgs(owner.address, amount);
          });
        });
      });
    });

    describe("Withdraw", function () {
      describe("Validations", function () {
        it("Should revert with the right error if called by address zero", async function () {
          const { owner } = await loadFixture(deployContracts);
          expect(owner.address).is.not.eq(ethers.ZeroAddress);
        });
      });

      describe("State Update", function () {
        it("Should update saving balance", async function () {
          const {
            tokenSavings,
            owner,
            token,
          } = await loadFixture(deployContracts);
          const amount = 1;
          await token.approve(tokenSavings.target, amount);
          await tokenSavings.deposit(amount);
          await tokenSavings.withdraw(amount);
          expect(await tokenSavings.checkUserBalance(owner.address)).eq(0);
        });

        describe("Events", function () {
          it("Should emit an event on withdraw", async function () {
            const { tokenSavings, owner, token } = await loadFixture(
              deployContracts
            );

            const amount = 1;
            await token.approve(tokenSavings.target, amount);
            await tokenSavings.deposit(amount);
            await expect(tokenSavings.withdraw(amount))
              .to.emit(tokenSavings, "WithdrawSuccessful")
              .withArgs(owner.address, amount);
          });
        });
      });
    });
  });

  describe("Ether", () => {
    describe("Deposit", () => {
      it("Should update contract state balance", async () => {
        const { ethSavings, owner } = await loadFixture(deployContracts);
        ethSavings.saveEther({ value: ethers.parseEther("1") });
        const userBalance = await ethSavings.retrieveUserEtherBalance(
          owner.address
        );

        expect(userBalance).eq(
          ethers.parseUnits(userBalance.toString(), "wei")
        );
      });

      it("Should check user ether balance", async () => {
        const { ethSavings, owner } = await loadFixture(deployContracts);
        ethSavings.saveEther({ value: ethers.parseEther("100") });
        const userBalance = await ethSavings.retrieveUserEtherBalance(
          owner.address
        );

        expect(
          Number((await ethers.provider.getBalance(owner.address)).toString())
        ).eq(
          Number((await ethers.provider.getBalance(owner.address)).toString()) -
          Number(ethers.parseUnits(userBalance.toString(), "wei"))
        );
      });

      it("Should check contract ether balance", async () => {
        const { ethSavings, owner } = await loadFixture(deployContracts);
        const ethbalance = await ethers.provider.getBalance(owner.address);
        ethSavings.saveEther({ value: ethers.parseEther("1") });
        const userBalance = await ethSavings.retrieveUserEtherBalance(
          owner.address
        );

        expect(
          Number(
            (await ethers.provider.getBalance(ethSavings.target)).toString()
          )
        ).eq(
          Number(
            (await ethers.provider.getBalance(ethSavings.target)).toString()
          ) + Number(ethers.parseUnits(userBalance.toString(), "wei"))
        );
      });
    });

    describe("Withdraw", () => {
      it("Should update contract state balance", async () => {
        const { ethSavings, owner } = await loadFixture(deployContracts);
        ethSavings.saveEther({ value: ethers.parseEther("1") });
        ethSavings.withdrawEther(ethers.parseEther("1"));
        const userBalance = await ethSavings.retrieveUserEtherBalance(
          owner.address
        );
        expect(userBalance.toString()).eq("0");
      });

      it("Should check contract ether balance", async () => {
        const { ethSavings, owner } = await loadFixture(deployContracts);
        ethSavings.saveEther({ value: ethers.parseEther("1") });
        ethSavings.withdrawEther(ethers.parseEther("1"));

        expect(await ethers.provider.getBalance(ethSavings.target)).eq(
          ethers.parseEther("0")
        );
      });
    });
  });
});

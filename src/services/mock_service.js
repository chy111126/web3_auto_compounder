import { BaseContractService } from './base_service.js';

/*
For mock service, it is simplified and account balances does not use big integers, which could suffer from rounding-error issues.
*/
export class MockContractService extends BaseContractService{
  
  async initialize(env) {
    // Virtual wallet account
    this.account = env.account;

    // Virtual LP pool setting
    this.lpPool = env.lpPool;

    // Token settings
    this.tokenA = env.tokens.tokenA;
    this.tokenB = env.tokens.tokenB;
    this.tokenLP = env.tokens.tokenLP;

    // transaction settings
    this.txnSettings = env.txnSettings;

    // Runtime-added fields:
    // Put up current price for mock service running over time
    this.tokenA.currentPrice = this.tokenA.initalPriceUSDT;
    this.tokenB.currentPrice = this.tokenB.initalPriceUSDT;

    // Accumulator for LP tokens
    this.lpPool.accountAddedTokenA = 0.0;
    this.lpPool.accountAddedTokenB = 0.0;
    this.lpPool.accountMintedLPToken = 0.0;
    this.lpPool.accountStakingLPToken = 0.0;

    return this;
  }
  
  async getTokenABalance() {
    // Get BEP-20 token balance from smart contract function, in terms of BEP-20 token unit (i.e. CAKE)
    return this.account.tokenABalance;
  }
  
  async getTokenBBalance() {
    // Get native token balance, in terms of native unit (i.e. BNB)
    return this.account.tokenBBalance;
  }

  async getLPTokenBalance(tokenAbi) {
    // Get LP token balance from smart contract function
    return this.account.tokenLPBalance;
  }

  async harvestTokenA() {
    // harvesting CAKE (A)
    // Assert the operation can be paid
    var gasFee = (this.txnSettings.harvestTokenA.gasPrice * this.txnSettings.harvestTokenA.gasLimit) / 10 ** this.tokenB.decimals;
    console.assert(this.account.tokenBBalance - gasFee > 0);

    // Put pending tokens from lp pool to wallet
    this.account.tokenABalance += this.lpPool.pendingToken;
    this.lpPool.pendingToken = 0.0;

    // Charge for gas fee
    this.account.tokenBBalance -= gasFee;
  }

  async swapTokenAToNative(tokenAAmount) {
    // selling CAKE (A) into BNB (B)
    // Assert the operation can be paid
    var gasFee = (this.txnSettings.swapTokenAToNative.gasPrice * this.txnSettings.swapTokenAToNative.gasLimit) / 10 ** this.tokenB.decimals;
    console.assert(this.account.tokenBBalance - gasFee > 0, gasFee);

    // Exchange from CAKE to BNB using their claimed rates
    var tokenBAmountToBeGet = this.tokenA.currentPrice / this.tokenB.currentPrice * tokenAAmount;
    this.account.tokenABalance -= tokenAAmount;
    this.account.tokenBBalance += tokenBAmountToBeGet;

    // Charge for gas fee
    this.account.tokenBBalance -= gasFee;
  }

  async getNewLP(tokenAAmount, tokenBAmount) {
    // getting new CAKE-BNB tokens by CAKE and BNB tokens above
    // Assert the operation can be paid
    var gasFee = (this.txnSettings.getNewLP.gasPrice * this.txnSettings.getNewLP.gasLimit) / 10 ** this.tokenB.decimals;
    console.assert(this.account.tokenBBalance - gasFee > 0, gasFee);

    // Move funds from wallet to LP pool
    this.account.tokenABalance -= tokenAAmount;
    this.lpPool.accountAddedTokenA += tokenAAmount;
    this.account.tokenBBalance -= tokenBAmount;
    this.lpPool.accountAddedTokenB += tokenBAmount;

    // Minting shares: Simple calculation based on existing issuance
    var totalTokenBLiquidity = this.lpPool.tokenBPool + this.lpPool.accountAddedTokenB;
    var totalLPTokens = this.lpPool.totalLPTokenIssued + this.lpPool.accountMintedLPToken + this.lpPool.accountStakingLPToken;
    var liquidities = tokenBAmount / totalTokenBLiquidity;
    var expectedLPTokenReceived = totalLPTokens * liquidities;

    // Put the minted LP to wallet
    this.account.tokenLPBalance += expectedLPTokenReceived;

    // Charge for gas fee
    this.account.tokenBBalance -= gasFee;
  }

  async reinvestLP() {
    // investing all CAKE-BNB LPs into the yield farm
    // Assert the operation can be paid
    var gasFee = (this.txnSettings.reinvestLP.gasPrice * this.txnSettings.reinvestLP.gasLimit) / 10 ** this.tokenB.decimals;
    console.assert(this.account.tokenBBalance - gasFee > 0, gasFee);

    // Put minted LP to staking pool
    this.lpPool.accountStakingLPToken += this.account.tokenLPBalance;
    this.account.tokenLPBalance = 0;

    // Charge for gas fee
    this.account.tokenBBalance -= gasFee;
  }

  async getTokenAReward() {
    // getting pending reward from staking CAKE-BNB LP pair
    return this.lpPool.pendingToken;
  }

}

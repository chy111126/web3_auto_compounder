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
    // this.lpPool.accountAddedTokenA = 0.0;
    // this.lpPool.accountAddedTokenB = 0.0;
    this.lpPool.initialTokenAPriceInB = this.tokenA.currentPrice / this.tokenB.currentPrice;
    this.lpPool.liquiditySquare = this.lpPool.tokenAPool * this.lpPool.tokenBPool;
    this.lpPool.accountStakingLPToken = 0.0;

    // Clock for simulation
    this.tick = 0;
    this.ticksPerYear = 365 * 24;

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
    this.account.tokenBBalance -= tokenBAmount;

    this.lpPool.tokenAPool += tokenAAmount;
    this.lpPool.tokenBPool += tokenBAmount;

    // Minting shares: Simple calculation based on existing issuance, based on token B
    var totalTokenBLiquidity = this.lpPool.tokenBPool;
    var totalLPTokens = this.lpPool.totalLPTokenIssued + this.account.tokenLPBalance + this.lpPool.accountStakingLPToken;
    var liquidities = tokenBAmount / totalTokenBLiquidity;
    var expectedLPTokenReceived = totalLPTokens * liquidities;

    // Put the minted LP to wallet
    this.account.tokenLPBalance += expectedLPTokenReceived;

    // Charge for gas fee
    this.account.tokenBBalance -= gasFee;
  }

  async stakeLP(tokenLPAmount) {
    // investing all CAKE-BNB LPs into the yield farm
    // Assert the operation can be paid
    var gasFee = (this.txnSettings.stakeLP.gasPrice * this.txnSettings.stakeLP.gasLimit) / 10 ** this.tokenB.decimals;
    console.assert(this.account.tokenBBalance - gasFee > 0, gasFee);

    // Put minted LP to staking pool
    this.lpPool.accountStakingLPToken += this.account.tokenLPBalance;
    this.account.tokenLPBalance = 0;

    // Charge for gas fee
    this.account.tokenBBalance -= gasFee;
  }

  async getStakedLPBalance() {
    // getting token amount that is staked in CANE-BNB LP pool
    return this.lpPool.accountStakingLPToken;
  }

  async unstakeAndRemoveLP() {
    // unstake the LP and remove liquidity back to CAKE and BNB

    // Put pending tokens from lp pool to wallet
    this.account.tokenABalance += this.lpPool.pendingToken;
    this.lpPool.pendingToken = 0.0;
    
    // Unstake LP from pool
    this.account.tokenLPBalance += this.lpPool.accountStakingLPToken;
    this.lpPool.accountStakingLPToken = 0;

    // Remove liquidity
    // var initialAToBPrice = this.tokenA.initalPriceUSDT / this.tokenB.initalPriceUSDT; // 0.0333 BNB per CAKE at start
    var finalAToBPrice = this.tokenA.currentPrice / this.tokenB.currentPrice; // 0.0205 BNB per CAKE at the end
    
    var finalTokenAReserve = Math.sqrt(this.lpPool.liquiditySquare / finalAToBPrice);
    var finalTokenBReserve = Math.sqrt(this.lpPool.liquiditySquare * finalAToBPrice);
    
    // Get Token A/B from issued LP
    var totalLPTokens = this.lpPool.totalLPTokenIssued + this.account.tokenLPBalance + this.lpPool.accountStakingLPToken;
    var liquidities = this.account.tokenLPBalance / totalLPTokens;
    var retrievedTokenA = liquidities * finalTokenAReserve;
    var retrievedTokenB = liquidities * finalTokenBReserve;
    console.log(finalTokenAReserve, finalTokenBReserve, retrievedTokenA, retrievedTokenB);

    // Put retrieved token back to wallet
    this.account.tokenABalance += retrievedTokenA;
    this.account.tokenBBalance += retrievedTokenB;

    // Burn LP token
    this.account.tokenLPBalance = 0;
  }

  async getTokenAReward() {
    // getting pending reward from staking CAKE-BNB LP pair
    return this.lpPool.pendingToken;
  }

  async getTokenAPricePerB() {
    // getting token A price based on token B (i.e. CAKE/BNB)
    return this.tokenA.currentPrice / this.tokenB.currentPrice * 1;
  }

  mockTick(tickAmount) {
    // Mock service tick() to simulate state change from a running clock, each tick has a unit of 1 hour
    var lastTick = this.tick;
    this.tick += tickAmount;

    // Update token prices, simple lerp function
    this.tokenA.currentPrice = this.tokenA.initalPriceUSDT * (1 * (1 - this.tick / this.ticksPerYear) + this.tokenA.priceYearlyChange * this.tick / this.ticksPerYear);
    this.tokenB.currentPrice = this.tokenB.initalPriceUSDT * (1 * (1 - this.tick / this.ticksPerYear) + this.tokenB.priceYearlyChange * this.tick / this.ticksPerYear);

    // Issue LP reward according to available liquidity shares
    var totalLPTokens = this.lpPool.totalLPTokenIssued + this.account.tokenLPBalance + this.lpPool.accountStakingLPToken;
    var liquidities = this.lpPool.accountStakingLPToken / totalLPTokens;
    // console.log(this.lpPool.totalLPTokenIssued, this.lpPool.accountMintedLPToken, this.lpPool.accountStakingLPToken)
    var issuedTokenAReward = this.lpPool.dailyIssuedTokenAAmount * liquidities * (this.tick - lastTick) / 24;
    this.lpPool.pendingToken += issuedTokenAReward;

    // Update liquidity pool
    this.lpPool.liquiditySquare = this.lpPool.tokenAPool * this.lpPool.tokenBPool;
  }

}

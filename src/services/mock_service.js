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
    this.lpPool.initialTokenAPriceInB = this.tokenA.currentPrice / this.tokenB.currentPrice;
    this.lpPool.liquiditySquare = this.lpPool.tokenAPool * this.lpPool.tokenBPool;
    this.lpPool.accountStakingLPToken = 0.0;

    // Clock for simulation
    this.tick = 0;
    this.ticksLimit = env.programSettings.tickLimit;

    return this;
  }

  async getTokenAPriceInUSDT() {
    // getting token A price in USDT
    return this.tokenA.currentPrice;
  }

  async getTokenBPriceInUSDT() {
    // getting token B price in USDT
    return this.tokenB.currentPrice;
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

    // Minting shares: Simple calculation based on existing issuance, based on token B before putting new funds in
    var totalTokenBLiquidity = this.lpPool.tokenBPool;
    var totalLPTokens = this.lpPool.totalLPTokenIssued + this.account.tokenLPBalance + this.lpPool.accountStakingLPToken;
    var liquidities = tokenBAmount / totalTokenBLiquidity;
    var expectedLPTokenReceived = totalLPTokens * liquidities;
    // console.log({totalTokenBLiquidity, totalLPTokens, liquidities, expectedLPTokenReceived});

    // Put the new funds for new base
    this.lpPool.tokenAPool += tokenAAmount;
    this.lpPool.tokenBPool += tokenBAmount;

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

  async unstakeLP(tokenLPAmount) {
    // unstaking the LP 
    // Assert the operation can be paid
    var gasFee = (this.txnSettings.unstakeLP.gasPrice * this.txnSettings.unstakeLP.gasLimit) / 10 ** this.tokenB.decimals;
    console.assert(this.account.tokenBBalance - gasFee > 0, gasFee);

    // Put pending tokens from lp pool to wallet
    this.account.tokenABalance += this.lpPool.pendingToken;
    this.lpPool.pendingToken = 0.0;
    
    // Unstake LP from pool
    this.account.tokenLPBalance += tokenLPAmount;
    this.lpPool.accountStakingLPToken = 0;
    
    // Charge for gas fee
    this.account.tokenBBalance -= gasFee;
  }

  async removeLP(tokenLPAmount) {
    // removing liquidity back to CAKE and BNB
    // Assert the operation can be paid
    var gasFee = (this.txnSettings.removeLP.gasPrice * this.txnSettings.removeLP.gasLimit) / 10 ** this.tokenB.decimals;
    console.assert(this.account.tokenBBalance - gasFee > 0, gasFee);

    // Remove liquidity
    var finalAToBPrice = this.tokenA.currentPrice / this.tokenB.currentPrice; // 0.0205 BNB per CAKE at the end
    // Update liquidity
    this.lpPool.liquiditySquare = this.lpPool.tokenAPool * this.lpPool.tokenBPool;
    var finalTokenAReserve = Math.sqrt(this.lpPool.liquiditySquare / finalAToBPrice);
    var finalTokenBReserve = Math.sqrt(this.lpPool.liquiditySquare * finalAToBPrice);
    
    // Get Token A/B from issued LP
    var totalLPTokens = this.lpPool.totalLPTokenIssued + this.account.tokenLPBalance + this.lpPool.accountStakingLPToken;
    var liquidities = tokenLPAmount / totalLPTokens;
    var retrievedTokenA = liquidities * finalTokenAReserve;
    var retrievedTokenB = liquidities * finalTokenBReserve;
    var accountLPBalance = this.account.tokenLPBalance;
    console.log({finalAToBPrice, totalLPTokens, liquidities, accountLPBalance, finalTokenAReserve, finalTokenBReserve, retrievedTokenA, retrievedTokenB});

    // Put retrieved token back to wallet
    this.account.tokenABalance += retrievedTokenA;
    this.account.tokenBBalance += retrievedTokenB;

    // Burn LP token
    this.account.tokenLPBalance -= tokenLPAmount;
    
    // Charge for gas fee
    this.account.tokenBBalance -= gasFee;
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
    this.tokenA.currentPrice = this.tokenA.initalPriceUSDT * (1 * (1 - this.tick / this.ticksLimit) + this.tokenA.priceYearlyChange * this.tick / this.ticksLimit);
    this.tokenB.currentPrice = this.tokenB.initalPriceUSDT * (1 * (1 - this.tick / this.ticksLimit) + this.tokenB.priceYearlyChange * this.tick / this.ticksLimit);

    // Issue LP reward according to available liquidity shares
    var totalLPTokens = this.lpPool.totalLPTokenIssued + this.account.tokenLPBalance + this.lpPool.accountStakingLPToken;
    var liquidities = this.lpPool.accountStakingLPToken / totalLPTokens;
    var issuedTokenAReward = this.lpPool.dailyIssuedTokenAAmount * liquidities * (this.tick - lastTick) / 24;
    this.lpPool.pendingToken += issuedTokenAReward;
    // console.log(this.lpPool.dailyIssuedTokenAAmount);

    // Update liquidity pool
    this.lpPool.liquiditySquare = this.lpPool.tokenAPool * this.lpPool.tokenBPool;
  }

}

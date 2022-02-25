import Web3 from 'web3';
import { lpAbi, routerAbi, tokenAbi } from "./abis/bakeryswap.js";
import { BaseContractService } from './base_service.js';

export class BakerySwapContractService extends BaseContractService{

  async initialize(env, accountPrivateKey) {
    // Web3 provider
    this.web3 = new Web3(env.web3provider.rpc);
    // Check if chain id is set correctly
    this.connectedChainId = await this.web3.eth.net.getId();
    console.assert(this.connectedChainId == env.web3provider.chainId);

    // Wallet account
    this.account = this.web3.eth.accounts.privateKeyToAccount(accountPrivateKey);

    // DEX setting
    this.routerAddress = env.dexAddresses.router;

    // Token settings
    this.tokenA = env.tokens.tokenA;
    this.tokenB = env.tokens.tokenB;
    this.tokenLP = env.tokens.tokenLP;

    // transaction settings
    this.txnSettings = env.txnSettings;

    return this;
  }

  async getTokenAPriceInUSDT() {
    // TODO: Quote the price from an oracle service, implementation is skipped here as this is for yield checking only
    return 0.0;
  }

  async getTokenBPriceInUSDT() {
    // TODO: Quote the price from an oracle service, implementation is skipped here as this is for yield checking only
    return 0.0;
  }

  async getTokenABalance() {
    return await this._getTokenABalance(tokenAbi);
  }

  async getLPTokenBalance() {
    return await this._getLPTokenBalance(tokenAbi);
  }

  async harvestTokenA() {
    var contract = new this.web3.eth.Contract(lpAbi, this.tokenLP.stakingAddress);
    var data = contract.methods.harvest();

    // Prepare the transaction
    var rawTransaction = {
        "from": this.account.address,
        "to": this.tokenLP.stakingAddress,
        "value": 0,
        "data":data.encodeABI(),
        "gasPrice": this.txnSettings.harvestTokenA.gasPrice,
        "gasLimit": this.txnSettings.harvestTokenA.gasLimit,
    };
    var txnResult = await this._doTransaction(rawTransaction);

    return txnResult;
  }

  async swapTokenAToNative(tokenAAmount) {
    var amountIn = this.web3.utils.toWei(tokenAAmount.toString(), 'ether');
    var routerPath = [this.tokenA.address, this.tokenB.wrappedAddress];

    // Get price-converted output amount
    var amountOutMin = await this._getAmountsOut(
      routerAbi,
      this.web3.utils.toHex(amountIn),
      routerPath,
    );

    // Preparing txn data from contract
    // For this, the route is CAKE -> WBNB -> BNB
    var contract = new this.web3.eth.Contract(routerAbi, this.routerAddress);
    var data = contract.methods.swapExactTokensForBNB(
      this.web3.utils.toHex(amountIn),
      this.web3.utils.toHex(amountOutMin),
      routerPath,
      this.account.address,
      this.web3.utils.toHex(Math.round(Date.now()/1000)+60*20),
    );

    // Prepare the transaction
    var rawTransaction = {
        "from": this.account.address,
        "to": this.routerAddress,
        "value": 0,
        "data":data.encodeABI(),
        "gasPrice": this.txnSettings.swapTokenAToNative.gasPrice,
        "gasLimit": this.txnSettings.swapTokenAToNative.gasLimit,
    };
    var txnResult = await this._doTransaction(rawTransaction);

    return txnResult;
  }

  async getNewLP(tokenAAmount, tokenBAmount) {
    // Controlling WETH/token liquidity ratio shall be done already by caller function
    console.log("Minting LP tokens for A=", tokenAAmount, "; B=", tokenBAmount);
    /*
    Note for implementation:
    amountTokenDesired: The amount of token to add as liquidity if the WETH/token price is <= msg.value/amountTokenDesired (token depreciates).
    msg.value (amountETHDesired): The amount of ETH to add as liquidity if the token/WETH price is <= amountTokenDesired/msg.value (WETH depreciates).
    amountTokenMin: Bounds the extent to which the WETH/token price can go up before the transaction reverts. Must be <= amountTokenDesired.
    amountETHMin: Bounds the extent to which the token/WETH price can go up before the transaction reverts. Must be <= msg.value.
    */

    // Convert token A/B to wei format
    var tokenAWeis = this.web3.utils.toWei(tokenAAmount.toString(), 'ether');
    var tokenBWeis = this.web3.utils.toWei(tokenBAmount.toString(), 'ether');

    // Preparing txn data from contract
    var slippage = 0.05;
    var contract = new this.web3.eth.Contract(routerAbi, this.routerAddress);
    var data = contract.methods.addLiquidityBNB(
      this.tokenA.address,
      this.web3.utils.toHex(tokenAWeis),
      this.web3.utils.toHex(tokenAWeis * (1 - slippage)),
      this.web3.utils.toHex(tokenBWeis * (1 - slippage)),
      this.account.address,
      this.web3.utils.toHex(Math.round(Date.now()/1000)+60*20),
    );

    // Prepare the transaction
    var rawTransaction = {
        "from": this.account.address,
        "to": this.routerAddress,
        "value": this.web3.utils.toHex(tokenBWeis),
        "data":data.encodeABI(),
        "gasPrice": this.txnSettings.getNewLP.gasPrice,
        "gasLimit": this.txnSettings.getNewLP.gasLimit,
    };
    var txnResult = await this._doTransaction(rawTransaction);

    return txnResult;
  }

  async stakeLP(tokenLPAmount) {
    var tokenLPWeis = this.web3.utils.toWei(tokenLPAmount.toString(), 'ether');
    var contract = new this.web3.eth.Contract(lpAbi, this.tokenLP.stakingAddress);
    var data = contract.methods.stake(
      this.tokenLP.address,
      this.web3.utils.toHex(tokenLPWeis),
    );

    // Prepare the transaction
    var rawTransaction = {
        "from": this.account.address,
        "to": this.tokenLP.stakingAddress,
        "value": 0,
        "data":data.encodeABI(),
        "gasPrice": this.txnSettings.stakeLP.gasPrice,
        "gasLimit": this.txnSettings.stakeLP.gasLimit,
    };
    var txnResult = await this._doTransaction(rawTransaction);

    return txnResult;
  }

  async getStakedLPBalance() {
    // Skipping implementation as it is unused in the demostration
    throw new Error("Not yet implemented.");
  }

  async unstakeLP(tokenLPAmount) {
    // Skipping implementation as it is unused in the demostration
    throw new Error("Not yet implemented.");
  }

  async removeLP(tokenLPAmount) {
    // Skipping implementation as it is unused in the demostration
    throw new Error("Not yet implemented.");
  }

  async getTokenAReward() {
    // Get BEP-20 pending token from smart contract function, in terms of BEP-20 token unit (i.e. CAKE)
    var contract = new this.web3.eth.Contract(lpAbi, this.tokenLP.stakingAddress);
    var balance = await contract.methods.pendingToken(this.tokenLP.address, this.account.address).call();
    var ptBalance = this.web3.utils.fromWei(balance, 'ether');

    return ptBalance;
  }

  async getTokenAPricePerB() {
    // getting token A price based on token B (i.e. CAKE/BNB)
    var amountIn = this.web3.utils.toWei('1', 'ether');
    var routerPath = [this.tokenA.address, this.tokenB.wrappedAddress];

    // Get price-converted output amount
    var amountOutMin = await this._getAmountsOut(
      routerAbi,
      this.web3.utils.toHex(amountIn),
      routerPath,
    );

    // Convert back to decimal unit
    return this.web3.utils.fromWei(amountOutMin, 'ether');
  }

}

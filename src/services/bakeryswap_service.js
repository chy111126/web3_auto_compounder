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

  async getTokenABalance() {
    // Get BEP-20 token balance from smart contract function, in terms of BEP-20 token unit (i.e. CAKE)
    var contract = new this.web3.eth.Contract(tokenAbi, this.tokenA.address);
    var balance = await contract.methods.balanceOf(this.account.address).call();
    var aBalance = this.web3.utils.fromWei(balance, 'ether');

    return aBalance;
  }

  async getTokenBBalance() {
    // Get native token balance, in terms of native unit (i.e. BNB)
    var balance = await this.web3.eth.getBalance(this.account.address);
    var bBalance = this.web3.utils.fromWei(balance, 'ether');
    
    return bBalance;
  }

  async getLPTokenBalance() {
    // Get LP token balance from smart contract function
    var contract = new this.web3.eth.Contract(tokenAbi, this.tokenLP.address);
    var balance = await contract.methods.balanceOf(this.account.address).call();
    var lpBalance = this.web3.utils.fromWei(balance, 'ether');

    return lpBalance;
  }

  async _getAmountsOut(amountIn, path) {
    // ABI function getAmountsOut for estimating amountOutMin
    var contract = new this.web3.eth.Contract(routerAbi, this.routerAddress);
    var amountOutMin = await contract.methods.getAmountsOut(amountIn, path).call();
    return amountOutMin[1];
  }

  async _doTransaction(rawTransaction) {
    // Sign and broadcast the transaction from raw txn data
    
    // TODO: Use estimated gas function for all functions. Right now we just hardcoded gas fees for simplicity
    // Gas fee = gasLimit * gasPrice + value.
    var count = await this.web3.eth.getTransactionCount(this.account.address);
    rawTransaction['nouce'] = this.web3.utils.toHex(count);
    rawTransaction['chainId'] = this.connectedChainId;

    var signedTx = await this.account.signTransaction(rawTransaction);
    var result = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
    .on('transactionHash', function(hash){
        // console.log('transactionHash', hash);
    })
    .on('confirmation', function(confirmationNumber, receipt){
        // console.log('confirmation', confirmationNumber, receipt);
    })
    .on('receipt', function(receipt){
        // console.log('receipt', receipt);
    })
    .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.error("Error:", error, "Receipt:", receipt);
    });

    return result;
  }

  // harvesting CAKE (A)
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

  // selling half of the CAKE (A) into BNB (B)
  async swapTokenAToNative(tokenAAmount) {
    var amountIn = tokenAAmount * 10 ** this.tokenA.decimals;
    var routerPath = [this.tokenA.address, this.tokenB.wrappedAddress];

    // Get price-converted output amount
    var amountOutMin = await this._getAmountsOut(
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

  // getting new CAKE-BNB tokens by CAKE and BNB tokens above
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
    var tokenAWeis = tokenAAmount * 10 ** this.tokenA.decimals;
    var tokenBWeis = tokenBAmount * 10 ** this.tokenB.decimals;

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

  // re-investing all CAKE-BNB LPs into the yield farm
  async stakeLP(tokenLPAmount) {
    var tokenLPWeis = tokenLPAmount * 10 ** this.tokenLP.decimals;
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

}

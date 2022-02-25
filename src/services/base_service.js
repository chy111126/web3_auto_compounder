/*
Base class for smart contract service. This service will invoke the blockchain smart contract (e.g. BSC).
The smart contract service should support two tokens: A and native token (B)
*/
export class BaseContractService {
  
  async initialize(env, accountPrivateKey) {
    // Inherited class shall implement these fields for Web3 services
    // this.web3: Web3
    // this.connectedChainId
    // this.account
    // this.routerAddress
    // this.tokenA
    // this.tokenB
    // this.tokenLP
    // this.txnSettings
    throw new Error("Not yet implemented.");
  }

  getTokenAName() {
    return this.tokenA.name;
  }

  getTokenBName() {
    return this.tokenB.name;
  }

  async getTokenAPriceInUSDT() {
    // getting token A price in USDT
    throw new Error("Not yet implemented.");
  }

  async getTokenBPriceInUSDT() {
    // getting token B price in USDT
    throw new Error("Not yet implemented.");
  }

  async getTokenABalance() {
    // Get BEP-20 token balance from smart contract function, in terms of BEP-20 token unit (i.e. CAKE)
    // Inherited function shall supplement the token ABI for the internal function below, but caller does not need to take care of this.
    throw new Error("Not yet implemented.");
  }

  async _getTokenABalance(tokenAbi) {
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
    // Inherited function shall supplement the token ABI for the internal function below, but caller does not need to take care of this.
    throw new Error("Not yet implemented.");
  }

  async _getLPTokenBalance(tokenAbi) {
    // Get LP token balance from smart contract function
    var contract = new this.web3.eth.Contract(tokenAbi, this.tokenLP.address);
    var balance = await contract.methods.balanceOf(this.account.address).call();
    var lpBalance = this.web3.utils.fromWei(balance, 'ether');

    return lpBalance;
  }

  async _getAmountsOut(routerAbi, amountIn, path) {
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

  async harvestTokenA() {
    // harvesting CAKE (A)
    throw new Error("Not yet implemented.");
  }

  async swapTokenAToNative(tokenAAmount) {
    // selling CAKE (A) into BNB (B)
    throw new Error("Not yet implemented.");
  }

  async getNewLP(tokenAAmount, tokenBAmount) {
    // getting new CAKE-BNB tokens by CAKE and BNB tokens above
    throw new Error("Not yet implemented.");
  }

  async stakeLP(tokenLPAmount) {
    // investing all CAKE-BNB LPs into the yield farm
    throw new Error("Not yet implemented.");
  }

  async getStakedLPBalance() {
    // getting token amount that is staked in CANE-BNB LP pool
    throw new Error("Not yet implemented.");
  }

  async unstakeLP(tokenLPAmount) {
    // unstaking the LP 
    throw new Error("Not yet implemented.");
  }

  async removeLP(tokenLPAmount) {
    // removing liquidity back to CAKE and BNB
    throw new Error("Not yet implemented.");
  }

  async getTokenAReward() {
    // getting pending reward from staking CAKE-BNB LP pair
    throw new Error("Not yet implemented.");
  }

  async getTokenAPricePerB() {
    // getting token A price based on token B (i.e. CAKE/BNB)
    throw new Error("Not yet implemented.");
  }

  // Local helper functions

  getTokenAUnit() {
    // Get the name "CAKE" for CAKE-BNB example
    return this.tokenA.name;
  }

  getTokenBUnit() {
    // Get the name "BNB" for CAKE-BNB example
    return this.tokenB.name;
  }

  getExpectedControlCost() {
    // From gas fee settings, compute the control cost that the pending reward shall be higher than this value
    // This function should be returning cost in terms of native token B
    
    // The control flow of the program is expected to be the following:
    // (looping getTokenAReward) -> harvestTokenA -> swapTokenAToNative -> getNewLP -> reinvestLP -> loop
    // So the control cost is by adding up all contract txn functions, as sum of gasPrice * gasLimit

    var invokingFunctions = [
      this.txnSettings.harvestTokenA,
      this.txnSettings.swapTokenAToNative,
      this.txnSettings.getNewLP,
      this.txnSettings.stakeLP,
    ];

    return invokingFunctions.reduce((prevSum, currentFunction) => prevSum + (currentFunction.gasPrice * currentFunction.gasLimit), 0) / 10 ** this.tokenB.decimals;
  }

}

/*
Base class for smart contract service. This service will invoke the blockchain smart contract (e.g. BSC).
The smart contract service should support two tokens: A and native token (B)
*/
export class BaseContractService {
  
  initialize(env, accountPrivateKey) {
    // Inherited class shall implement these fields
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

  getTokenABalance() {
    throw new Error("Not yet implemented.");
  }

  getTokenBBalance() {
    throw new Error("Not yet implemented.");
  }

  // harvesting CAKE (A)
  harvestTokenA() {
    throw new Error("Not yet implemented.");
  }

  // selling half of the CAKE (A) into BNB (B)
  swapTokenAToNative(tokenAAmount) {
    throw new Error("Not yet implemented.");
  }

  // getting new CAKE-BNB tokens by CAKE and BNB tokens above
  getNewLP(tokenAAmount, tokenBAmount) {
    throw new Error("Not yet implemented.");
  }

  // re-investing all CAKE-BNB LPs into the yield farm
  reinvestLP() {
    throw new Error("Not yet implemented.");
  }

}

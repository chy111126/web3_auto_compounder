# Web3.js Auto-compounder

This is an assignment for auto-compounding a LP-staking pool from a DEX (e.g. PancakeSwap).

## Demo links:
[Mock service](https://github.com/chy111126/web3_auto_compounder/blob/572eada1668926bfcc2627d288cb3b394b779bb0/static/mock_demo.mov)

[BakerySwap service with testnet (test smart contract methods only)](https://github.com/chy111126/web3_auto_compounder/blob/572eada1668926bfcc2627d288cb3b394b779bb0/static/testnet_demo.mov)

## Build instruction

**Pre-requisite: NodeJS v14.0 or above**

1. In the project root folder, type: `npm install`
2. To run with mock service, type: `node src/app.js`
3. To run with BSC testnet:
    1. Put your 64-character private key to `src/common/wallets/bsc_testnet.txt`
    2. Type: `node src/app_testnet.js <<METHOD NAME>>`

## Technical details

For this auto-compounder, an expected cost will be estimated for doing the harvest-swap-LP minting and staking loop. If the currently-pending reward exceeds this expected cost by a certain factor (e.g. 10), the reinvesting loop will be invoked. The default time interval for this routine is every hour and it is configurable from a config file.

---

This auto-compounder supports two DEXs at the moment: a mock DEX happened entirely within NodeJS, and BakerySwap running in BSC testnet.

### Mock DEX

To simulate a long-term investment strategy, the mock service will setup an environment with the following assumptions:

- Two tokens are supported, each with an initial price in USDT and has an assumption of price change linearly over a year.
- Gas is charged by gas price * gas limit, defined in a config file.
- An initial amount of the two tokens are supplied and an initial amount of LP token would be staked.
- The LP pool will have daily issued reward and distributed according to shares per wallet.
- The yield is calculated in terms of (final wallet value in USDT - initial wallet value in USDT) / initial wallet value in USDT.

The details of setting can be found at: `src/common/envs/cake_bnb_mock.js`

### BakerySwap

An implementation based on BakerySwap router/token/etc. smart contracts. Since the code has been tested under BSC testnet, reward function cannot be tested as there are no yields to harvest. However, several functions are still exposed to proof that web3.js invocation works and it should work theoretically under real-world environment.

The details of setting can be found at: `src/common/envs/cakebake_bnb_testnet.js`
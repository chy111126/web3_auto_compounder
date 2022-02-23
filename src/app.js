import { exit } from "process";
import { MockContractService } from "./services/mock_service.js";

// Create service and auto-compunder environment
var data = (await import('fs')).readFileSync('./src/common/wallets/bsc_testnet.txt', 'utf8');
var env = (await import("./common/envs/cake_bnb_mock.js")).env;
var cs = await new MockContractService().initialize(env);

// Get initial stats
var tokenPair = `${cs.getTokenAName()}/${cs.getTokenBName()}`;
console.log(`Program start: ${tokenPair} price ${await cs.getTokenAPricePerB()}`);
var tokenAAmount = await cs.getTokenABalance();
var tokenBAmount = await cs.getTokenBBalance();
console.log(`Wallet initial balance: ${cs.getTokenAName()}=>${tokenAAmount}; ${cs.getTokenBName()}=>${tokenBAmount}; LP=>${await cs.getLPTokenBalance()}`);
var walletValueUSDT = tokenAAmount * await cs.getTokenAPriceInUSDT() + tokenBAmount * await cs.getTokenBPriceInUSDT();
console.log(`Wallet value in USDT: ${walletValueUSDT}`);

// Program running time
var tick = 0;
var tickDelta = env.programSettings.tickDelta;
var timeDelay = env.programSettings.timeDelay || env.programSettings.tickDelta * 60 * 60 * 1000;
var tickLimit = env.programSettings.tickLimit; 
var autoCompunding = env.programSettings.autoCompunding;
var reinvestCostRatio = env.programSettings.reinvestCostRatio;
console.log({tickDelta, timeDelay, tickLimit, autoCompunding, reinvestCostRatio});

// Stake initial LP for mock
var targetingTokenA = await cs.getTokenABalance();
var tokenPairPrice = await cs.getTokenAPricePerB();
var targetingTokenB = targetingTokenA * tokenPairPrice;
await cs.getNewLP(targetingTokenA, targetingTokenB);
console.log(`Wallet minted LP balance: ${cs.getTokenAName()}=>${await cs.getTokenABalance()}; ${cs.getTokenBName()}=>${await cs.getTokenBBalance()}; LP=>${await cs.getLPTokenBalance()}`);
var totalLP = await cs.getLPTokenBalance();
await cs.stakeLP(totalLP);

// Re-investing loop
while(tick < tickLimit) {
    // Check currently received reward
    var expectedControlCost = cs.getExpectedControlCost();
    var tokenPairPrice = await cs.getTokenAPricePerB();
    var tokenAReward = await cs.getTokenAReward();
    var tokenARewardInB = tokenAReward * tokenPairPrice;
    //console.log(`Tick=${tick}; Wallet: ${cs.getTokenAName()}=>${await cs.getTokenABalance()}; ${cs.getTokenBName()}=>${await cs.getTokenBBalance()}; LP=>${await cs.getLPTokenBalance()}; expectedControlCost: ${expectedControlCost}; Reward: ${tokenARewardInB}`)

    if (tokenARewardInB > expectedControlCost * reinvestCostRatio && autoCompunding) {
        // Harvest and reinvest if criteria met
        await cs.harvestTokenA();

        // Swap tokens
        var targetingTokenA = await cs.getTokenABalance() / 2;
        // Excluding gas fee and back-calculate token A amount for LP
        var targetingTokenB = targetingTokenA * tokenPairPrice - expectedControlCost;
        var targetingTokenAExcludingCost = targetingTokenB / tokenPairPrice;
        await cs.swapTokenAToNative(targetingTokenA);

        // Create LP
        await cs.getNewLP(targetingTokenAExcludingCost, targetingTokenB);
        var totalLP = await cs.getLPTokenBalance();
        await cs.stakeLP(totalLP);

    }
    
    // Progress time
    cs.mockTick(tickDelta);
    tick += tickDelta;
    if (timeDelay > 1) {
        await new Promise(resolve => setTimeout(resolve, timeDelay));
    }
}

// Post-step after the re-invest loop
await cs.unstakeLP(await cs.getStakedLPBalance());
await cs.removeLP(await cs.getLPTokenBalance());
var tokenAAmount = await cs.getTokenABalance();
var tokenBAmount = await cs.getTokenBBalance();
console.log(`Final wallet balance: ${cs.getTokenAName()}=>${tokenAAmount}; ${cs.getTokenBName()}=>${tokenBAmount}; LP=>${await cs.getLPTokenBalance()}`);
var finalWalletValueUSDT = tokenAAmount * await cs.getTokenAPriceInUSDT() + tokenBAmount * await cs.getTokenBPriceInUSDT();
console.log(`Final wallet value in USDT: ${finalWalletValueUSDT}`);
console.log(`Auto-compounder yield: ${(finalWalletValueUSDT - walletValueUSDT) / walletValueUSDT * 100}%`);

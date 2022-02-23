import { MockContractService } from "./services/mock_service.js";

// Get private key
var data = (await import('fs')).readFileSync('./src/common/wallets/bsc_testnet.txt', 'utf8');

// Create service and auto-compunder environment
var env = (await import("./common/envs/cake_bnb_mock_no_variance.js")).env;
var cs = await new MockContractService().initialize(env);

// Get initial stats
var tokenPair = `${cs.getTokenAName()}/${cs.getTokenBName()}`;
console.log(`Program start: ${tokenPair} price ${await cs.getTokenAPricePerB()}`);
console.log(`Wallet initial balance: ${cs.getTokenAName()}=>${await cs.getTokenABalance()}; ${cs.getTokenBName()}=>${await cs.getTokenBBalance()}; LP=>${await cs.getLPTokenBalance()}`);

// Program running time
var tick = 0;
var tickDelta = 10; // Tick progression in hours;
var timeDelay = 50; // While-loop time delay, default equals to tickDelta
var tickLimit = 365 * 24; 

// Stake initial LP for mock
var targetingTokenA = await cs.getTokenABalance();
var tokenPairPrice = await cs.getTokenAPricePerB();
var targetingTokenB = targetingTokenA * tokenPairPrice;
await cs.getNewLP(targetingTokenA, targetingTokenB);
var totalLP = await cs.getLPTokenBalance();
await cs.stakeLP(totalLP);


while(tick < tickLimit) {
    // Check currently received reward
    var expectedControlCost = cs.getExpectedControlCost();
    var tokenPairPrice = await cs.getTokenAPricePerB();
    var tokenAReward = await cs.getTokenAReward();
    var tokenARewardInB = tokenAReward * tokenPairPrice;
    //console.log(`Tick=${tick}; Wallet: ${cs.getTokenAName()}=>${await cs.getTokenABalance()}; ${cs.getTokenBName()}=>${await cs.getTokenBBalance()}; LP=>${await cs.getLPTokenBalance()}; expectedControlCost: ${expectedControlCost}; Reward: ${tokenARewardInB}`)

    // For threshold, we need to preserve some BNB for LP+gas instead of using all for LP
    if (tokenARewardInB > expectedControlCost * 100 && true) {
        // console.log("-=-=-=-=-=-=-");
        // Harvest and reinvest if criteria met
        await cs.harvestTokenA();
        // console.log(`Wallet: ${cs.getTokenAName()}=>${await cs.getTokenABalance()}; ${cs.getTokenBName()}=>${await cs.getTokenBBalance()}; LP=>${await cs.getLPTokenBalance()}`)

        // Swap tokens
        var targetingTokenA = await cs.getTokenABalance() / 2;
        // Excluding gas fee and back-calculate token A amount for LP
        var targetingTokenB = targetingTokenA * tokenPairPrice - expectedControlCost;
        var targetingTokenAExcludingCost = targetingTokenB / tokenPairPrice;
        await cs.swapTokenAToNative(targetingTokenA);

        // console.log(`Wallet: ${cs.getTokenAName()}=>${await cs.getTokenABalance()}; ${cs.getTokenBName()}=>${await cs.getTokenBBalance()}; LP=>${await cs.getLPTokenBalance()}`)

        // Create LP
        // console.log(`Creating LP CAKE=${targetingTokenA} BNB=${targetingTokenB}`);
        await cs.getNewLP(targetingTokenAExcludingCost, targetingTokenB);
        var totalLP = await cs.getLPTokenBalance();
        await cs.stakeLP(totalLP);
        // console.log(cs.lpPool.accountStakingLPToken);
        // console.log("-=-=-=-=-=-=-");
    }
    
    // Progress time
    cs.mockTick(tickDelta);
    tick += tickDelta;
    // await new Promise(resolve => setTimeout(resolve, timeDelay));
}

await cs.unstakeAndRemoveLP();
console.log(`Final wallet: ${cs.getTokenAName()}=>${await cs.getTokenABalance()}; ${cs.getTokenBName()}=>${await cs.getTokenBBalance()}; LP=>${await cs.getLPTokenBalance()}`)



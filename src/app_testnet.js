// A separate routine for running web3.js code in BSC testnet

import { BakerySwapContractService } from "./services/bakeryswap_service.js";

// Get private key
var data = (await import('fs')).readFileSync('./src/common/wallets/bsc_testnet.txt', 'utf8');
var privateKey = data.toString();

// Auto-compunder environment
var env = (await import("./common/envs/bake_bnb_testnet.js")).env;

// Create service
var cs = await new BakerySwapContractService().initialize(env, privateKey);

// There must be an argument to start
console.assert(process.argv[2], "Please input a command for the service!");
if (process.argv[2]) {
    switch(process.argv[2]) {
        case "swapTokenAToNative":
            // Swap tokens
            var originalTokenA = await cs.getTokenABalance();
            var targetingTokenA = originalTokenA / 2;
            await cs.swapTokenAToNative(targetingTokenA);
            console.log(`Converted token A: ${originalTokenA} => ${targetingTokenA}`);
            break;
        case "getNewLP":
            var targetingTokenA = await cs.getTokenABalance();
            var expectedControlCost = cs.getExpectedControlCost();
            var tokenPairPrice = await cs.getTokenAPricePerB();
            console.log(`expectedControlCost: ${expectedControlCost}; tokenPairPrice: ${tokenPairPrice}`);
            // Excluding gas fee and back-calculate token A amount for LP
            var targetingTokenB = targetingTokenA * tokenPairPrice - expectedControlCost;
            var targetingTokenAExcludingCost = targetingTokenB / tokenPairPrice;
            console.log(`Getting LP by A: ${targetingTokenAExcludingCost} + B: ${targetingTokenB}`);
            // Create LP
            await cs.getNewLP(targetingTokenAExcludingCost, targetingTokenB);
            var totalLP = await cs.getLPTokenBalance();
            console.log(`Minted LP balance: ${totalLP}`);
            break;
        case "stakeLP":
            var totalLP = await cs.getLPTokenBalance();
            await cs.stakeLP(totalLP);
            var remainingLP = await cs.getLPTokenBalance();
            console.log(`Remaining LP balance in wallet: ${remainingLP}`);
            break;
        default:
            console.log("Invalid command, exiting ...");
    }
}

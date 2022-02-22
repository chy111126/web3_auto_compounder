import { BakerySwapContractService } from "./services/bakeryswap_service.js";

// Get private key
var data = (await import('fs')).readFileSync('./src/common/wallets/bsc_testnet.txt', 'utf8');
var privateKey = data.toString();

// Auto-compunder environment
var env = (await import("./common/envs/bake_bnb_testnet.js")).env;

// Create service
var bscs = await new BakerySwapContractService().initialize(env, privateKey);
// console.log(await bscs.swapTokenAToNative(50));
// console.log(await bscs.getNewLP(48, 0.0182518));
// console.log("Before LP balance:", await bscs.getLPTokenBalance());
// console.log(await bscs.stakeLP(0.1));
// After minting LP
console.log("Token A balance:", await bscs.getTokenABalance());
console.log("Token B balance:", await bscs.getTokenBBalance());
console.log("Token LP balance:", await bscs.getLPTokenBalance());
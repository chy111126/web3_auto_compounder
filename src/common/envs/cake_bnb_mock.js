export const env = {
    tokens: {
        tokenA: {
            name: "CAKE",
            initalPriceUSDT: 10.0, // Initial price of the token at tick = 0
            priceYearlyChange: 0.8, // Overall price change after a year => -10%
        },
        tokenB: {
            name: "BNB",
            decimals: 18, // Native token, must supply decimals for Wei-Ether conversion
            initalPriceUSDT: 300.0, // Initial price of the token at tick = 0
            priceYearlyChange: 1.3, // Overall price change after a year => +20%
        },
        tokenLP: {
            name: "CAKE-BNB LP",
        }
    },
    txnSettings: {
        harvestTokenA: {
            gasPrice: 20000000000, // Gas prices are in terms of wei
            gasLimit: 250000, // Gas limits are arbitary quotes to be consumed when invoking EVM
        },
        swapTokenAToNative: {
            gasPrice: 10000000000,
            gasLimit: 200000,
        },
        getNewLP: {
            gasPrice: 10000000000,
            gasLimit: 250000,
        },
        stakeLP: {
            gasPrice: 20000000000,
            gasLimit: 250000,
        },
    },
    account: {
        tokenABalance: 6000,
        tokenBBalance: 202,
        tokenLPBalance: 0.0,
    },
    lpPool: {
        pendingToken: 0.0,
        tokenAPool: 300000,
        tokenBPool: 10000,
        totalLPTokenIssued: 1000,
        dailyIssuedTokenAAmount: 100.0
    },
}
export const env = {
    tokens: {
        tokenA: {
            name: "CAKE",
            initalPriceUSDT: 10.0, // Initial price of the token at tick = 0
            priceYearlyChange: 1.0, // Overall price change after a year => -10%
        },
        tokenB: {
            name: "BNB",
            decimals: 18, // Native token, must supply decimals for Wei-Ether conversion
            initalPriceUSDT: 300.0, // Initial price of the token at tick = 0
            priceYearlyChange: 1.0, // Overall price change after a year => +20%
        },
        tokenLP: {
            name: "CAKE-BNB LP",
        }
    },
    txnSettings: {
        harvestTokenA: {
            gasPrice: 0, // Gas prices are in terms of wei
            gasLimit: 0, // Gas limits are arbitary quotes to be consumed when invoking EVM
        },
        swapTokenAToNative: {
            gasPrice: 0,
            gasLimit: 0,
        },
        getNewLP: {
            gasPrice: 0,
            gasLimit: 0,
        },
        stakeLP: {
            gasPrice: 0,
            gasLimit: 0,
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
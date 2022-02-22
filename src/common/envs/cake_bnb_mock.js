export const env = {
    tokens: {
        tokenA: {
            name: "CAKE",
            initalPriceUSDT: 10.0, // Initial price of the token at tick = 0
            priceYearlyChange: 0.9, // Overall price change after a year => -10%
        },
        tokenB: {
            name: "BNB",
            decimals: 18, // Native token, must supply decimals for Wei-Ether conversion
            initalPriceUSDT: 300.0, // Initial price of the token at tick = 0
            priceYearlyChange: 1.2, // Overall price change after a year => +20%
        },
        tokenLP: {
            name: "CAKE-BNB LP",
            expectedYearlyAPR: 1.00, // Expected yearly APR in percentage, 1.00 = 100% APR
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
        tokenABalance: 300,
        tokenBBalance: 20,
        tokenLPBalance: 0.0,
    },
    lpPool: {
        pendingToken: 0.0,
        tokenAPool: 300000,
        tokenBPool: 20000,
        totalLPTokenIssued: 1000,
    },
}
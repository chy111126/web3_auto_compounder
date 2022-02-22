export const env = {
    web3provider: {
        name: "Binance Smart Chain Testnet",
        rpc: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        chainId: 97,
    },
    dexAddresses: {
        name: "BakerySwap",
        router: "0xcde540d7eafe93ac5fe6233bee57e1270d3e330f",
        factory: "",
    },
    tokens: {
        tokenA: {
            name: "BAKE",
            decimals: 18,
            address: "0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5",
        },
        tokenB: {
            name: "BNB",
            decimals: 18,
            address: "native",
            wrappedAddress: "0x094616F0BdFB0b526bD735Bf66Eca0Ad254ca81F",
        },
        tokenLP: {
            name: "Bakery LP",
            decimals: 18,
            address: "0x47d34Fd4f095767E718F110AfEf030bb18E8C48F", // LP token address
            stakingAddress: "0x61d777dc41bb391c491a644974c18fc069ad3e62", // MasterChef V2 contract address
        }
    },
    txnSettings: {
        harvestTokenA: {
            gasPrice: 20000000000,
            gasLimit: 250000,
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
    }
}
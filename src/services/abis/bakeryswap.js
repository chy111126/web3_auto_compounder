/*
ABIs copied form BakerySwap
*/
export const routerAbi = [{
    "inputs": [{
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
    }, {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
    }, {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
    }, {
        "internalType": "address",
        "name": "to",
        "type": "address"
    }, {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
    }],
    "name": "swapExactTokensForBNB",
    "outputs": [{
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
    }],
    "type": "function"
},
{
    "inputs": [{
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
    }, {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
    }, {
        "internalType": "address",
        "name": "to",
        "type": "address"
    }, {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
    }],
    "name": "swapExactBNBForTokens",
    "outputs": [{
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
    }],
    "type": "function"
}, {
    "inputs":[
       {
          "internalType":"uint256",
          "name":"amountIn",
          "type":"uint256"
       },
       {
          "internalType":"address[]",
          "name":"path",
          "type":"address[]"
       }
    ],
    "name":"getAmountsOut",
    "outputs":[
       {
          "internalType":"uint256[]",
          "name":"amounts",
          "type":"uint256[]"
       }
    ],
    "type":"function"
 }, {
    "inputs":[
       {
          "internalType":"address",
          "name":"token",
          "type":"address"
       },
       {
          "internalType":"uint256",
          "name":"amountTokenDesired",
          "type":"uint256"
       },
       {
          "internalType":"uint256",
          "name":"amountTokenMin",
          "type":"uint256"
       },
       {
          "internalType":"uint256",
          "name":"amountBNBMin",
          "type":"uint256"
       },
       {
          "internalType":"address",
          "name":"to",
          "type":"address"
       },
       {
          "internalType":"uint256",
          "name":"deadline",
          "type":"uint256"
       }
    ],
    "name":"addLiquidityBNB",
    "outputs":[
       {
          "internalType":"uint256",
          "name":"amountToken",
          "type":"uint256"
       },
       {
          "internalType":"uint256",
          "name":"amountBNB",
          "type":"uint256"
       },
       {
          "internalType":"uint256",
          "name":"liquidity",
          "type":"uint256"
       }
    ],
    "type":"function"
 }];

 export const tokenAbi = [
    {
      "constant":true,
      "inputs":[{"name":"_owner","type":"address"}],
      "name":"balanceOf",
      "outputs":[{"name":"balance","type":"uint256"}],
      "type":"function"
    },
    {
      "constant":true,
      "inputs":[],
      "name":"decimals",
      "outputs":[{"name":"","type":"uint8"}],
      "type":"function"
}];

export const lpAbi = [
    {
      "inputs":[{"name":"token","type":"address"}, {"name":"amount","type":"uint256"}],
      "name":"stake",
      "outputs":[],
      "type":"function"
    },
    {
      "inputs":[],
      "name":"harvest",
      "outputs":[],
      "type":"function"
    }
];
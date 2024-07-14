import Web3 from 'web3';
//import { switchNetwork } from './wallet.js';
import { abiVote, abiERC20, abiRoyalty, abiStoreV1, abiStoreNFT } from './abi.js';
import { params } from './main.js';

export let MEH_FAUCET;
export let MEH_VOTE;
export let MEH_TOKEN;
export let MEH_ROYALTY;
export let USDC_TOKEN;
export let MEH_STORE;
export let MEH_STORE_NFT;
export let web3;
export let etherscan;
export let apiKey;
export let alchemy;

export let chainId;
export let networkName;

export let MEHToken;
export let USDCToken;
export let MEHVote;
export let MEHRoyalty;
export let MEHStore;
export let MEHStoreNFT;

export let chainInfo = [
    {"chainName": "Base Sepolia", "chainId": "0x14a34", "supported": true},
    {"chainName": "Base", "chainId": "0x2105", "supported": true},
    {"chainName": "Ethereum", "chainId": "0x1", "supported": false}
]

//init();

export async function init() {
    chainId = await params.provider.request({ method: 'eth_chainId' });
    web3 = new Web3(params.provider);
    if (chainId == '0x14a34') {    //  ----- BaseSepolia -----
        MEH_TOKEN = "0xEf4C3545edf08563bbC112D5CEf0A10B396Ea12E";
        MEH_FAUCET = "0x47FA1e09E9Ae17bC6F37A60F3C44f56D25213112";
        MEH_ROYALTY = "0x177C84EcDd00224d0b7B34e78De1bb7927b1d2B3";
        MEH_VOTE = "0xAC42e62be97abeAb7775cC4Bae84d0DB4223C508";
        USDC_TOKEN = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
        MEH_STORE_NFT = "0xBBE76f672d98c7Db1e580e6a73Ae5603cb4FD701"
        MEH_STORE = "0x92f1EE669f76e9ada53F41D2a9e27c6558d10F85"
        apiKey = "GBfdhUAKP01Zmxr9l8JybRbAnEH7YRb9";
        alchemy = "https://base-sepolia.g.alchemy.com/v2/";
        etherscan = "sepolia.basescan.org";
        networkName = "Base Sepolia";
    } else if (chainId == '0x2105') {    //  ----- Base -----
        MEH_TOKEN = "0xa999542c71FEbba77602fBc2F784bA9BA0C850F6";
        MEH_FAUCET = "0x97246294c9c373D5f3f5c0E0BA2D2029FF73877e";
        MEH_ROYALTY = "0x0F3b4250d174aDC7d1e90A438a1706404C85fFd4";
        MEH_VOTE = "0x617981E1DbDdAc0b7e14949B6dF784e92BC9bCDd";
        USDC_TOKEN = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
        MEH_STORE = "";
        MEH_STORE_NFT = "";
        apiKey = "DSDV-PHXPq4Znjpnwr4DkthBE6MLWc--";
        alchemy = "https://base-mainnet.g.alchemy.com/v2/"
        etherscan = "basescan.org";
        networkName = "Base Mainnet";
    } else {
        networkName = "Unsupported";
        console.error(`Error: Unsupported chain`);
//        document.getElementById("loading").classList.add('move'); // force the loading screen;
//        await switchNetwork(); // should check whether window is active or not
    }

    USDCToken = new web3.eth.Contract(abiERC20, USDC_TOKEN);
    MEHToken = new web3.eth.Contract(abiERC20, MEH_TOKEN);
    MEHVote = new web3.eth.Contract(abiVote, MEH_VOTE);
    MEHRoyalty = new web3.eth.Contract(abiRoyalty, MEH_ROYALTY);
    MEHStore = new web3.eth.Contract(abiStoreV1, MEH_STORE);
    MEHStoreNFT = new web3.eth.Contract(abiStoreNFT, MEH_STORE_NFT);

    window.MEHStore = MEHStore;
};


import '@fortawesome/fontawesome-free/css/all.min.css';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faCirclePlus, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';

import {
    loadStaticProductData,
//     updateTransactionQueue,
    displayProducts,
    updateLiveProductData,
    checkForContracts
} from './store.js';
import { reloadClient, showFAB } from './common.js';
import { init as walletInit, connect, tokenDisplay } from './wallet.js';
import { loadMyNFTs } from './nfts.js';


library.add(faCirclePlus, faTrashCan, faQuestion);
dom.watch();

export const params = {
    preferredNetwork: '0x14a34', // Sepolia
    //preferredNetwork: '0x2105', // Base
    onPreferredNetwork: null,
    currNetwork: null,
    gameId: 1,
//    timerDiv: document.getElementById("timer"),
//    timerStatusDiv: document.getElementById("timer_status"),
    contentDiv: document.getElementById("content"),
    walletDiv: document.getElementById("wallet_status"),
    tokenScale: 1000000000000000000,
    USDCScale: 1000000,
    assumedContracts: 1,
    gameStatus: 2, // 0 = not started, 1 = started, 2 = ended
    transactionQueue: [],
    updatesOnChain: false,
    provider: null,
    account: null,
    connection: 'static'  // oneOf('static', 'read', 'write')
    // static :: only what is provided on-load of webapp
    // read :: requires a provider and the correct chain
    // write :: additionally, requires an address
};

// SHOW WHAT WE CAN WITHOUT A PROVIDER / WALLET
await loadStaticProductData();
await prepConnectBtn();
await walletInit();
showFAB();
//updateTransactionQueue();

export function prepConnectBtn() {
    document.body.classList.add("disconnected");
    document.body.classList.remove("connected");
    params.walletDiv.innerText = 'Connect';
    params.walletDiv.addEventListener("click", connect);
    params.account = null;
}
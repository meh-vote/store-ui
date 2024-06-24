import '@fortawesome/fontawesome-free/css/all.min.css';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';

import {
    loadStaticProductData,
    displayProducts,
    updateLiveProductData,
    checkForContracts
} from './store.js';
import { reloadClient } from './common.js';
import { init as walletInit, connect, tokenDisplay } from './wallet.js';

library.add(faCirclePlus, faTrashCan);
dom.watch();

export const params = {
    //    preferredNetwork: '0x14a34', // Sepolia
    preferredNetwork: '0x2105', // Base
    currNetwork: null,
    gameId: 1,
//    timerDiv: document.getElementById("timer"),
//    timerStatusDiv: document.getElementById("timer_status"),
    contentDiv: document.getElementById("content"),
    walletDiv: document.getElementById("wallet_status"),
    tokenScale: 1000000000000000000,
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

/*export let sharedData = {
    view: 'vote'
}*/

// SHOW WHAT WE CAN WITHOUT A PROVIDER / WALLET
//await loadStaticGameData();
await loadStaticProductData();
await prepConnectBtn();
await walletInit();

export function prepConnectBtn() {
    document.body.classList.add("disconnected");
    document.body.classList.remove("connected");
    params.walletDiv.innerText = 'Connect';
    params.walletDiv.addEventListener("click", connect);
    params.account = null;
}

function showConnected() {
    document.body.classList.add("connected");
    document.body.classList.remove("disconnected");
    params.walletDiv.innerText = 'Connected';
    params.walletDiv.removeEventListener("click", connect);
//    console.info(`output meh token balance and approval amount`);
    tokenDisplay();
}

export function updateConnectionStatus(_status = 'static') {
    if (_status == 'read' && params.connection != 'read') { // we've just switched to read
        displayProducts(true);
        if (params.connection != 'write') {
            updateLiveProductData();
        } else {
            reloadClient()
        }
        params.connection = 'read';
    } else if (_status == 'write' && params.connection != 'write') { // we've just switched to write
        displayProducts(true);
        if (params.connection != 'read') {
            updateLiveProductData();
        }
        checkForContracts()
        showConnected()
        params.connection = 'write';
    } else if (_status == 'static' && params.connection != 'static') {  // we've just switched to static
        reloadClient()
    } else {
        throw new Error(`Trying to switch to/from an unknown connection type: ${params.connection} ... ${_status}`);
    }
}
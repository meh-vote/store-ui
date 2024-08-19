import detectEthereumProvider from '@metamask/detect-provider';
import { init as addrInit, chainInfo, chainId } from './addr.js';
import { params, prepConnectBtn } from "./main.js";
import { showErrors, reloadClient, checkRemainingApproval, checkMehBalance, shortenNumber, removeApproval } from './common.js';
import { approveMeh, displayProducts } from './store.js';

export async function init() {
    // this returns the provider, or null if it wasn't detected
    params.provider = await detectEthereumProvider();

    if (params.provider) {
        await startApp(params.provider); // Initialize your app
    } else {
        console.log('Please install MetaMask!');
        showSuccess("This is the Meh dapp, and requires a web3 provider.<br>We will redirect you to our Shopify store.");
        setTimeout(() => { window.location.assign("https://web2.meh.store/"); }, 3000);
        // call showErrors with stop
    }
}

async function startApp(_provider) {
    if (_provider !== window.ethereum) {
        console.error('Do you have multiple wallets installed?');
        // If the provider returned by detectEthereumProvider is not the same as
        // window.ethereum, something is overwriting it. There are likely multiple wallets.
        showErrors("There was an error getting your provider, do you have multiple wallets installed?", true);
    }

    ethereum.on('chainChanged', handleChainChanged);

    // Note that accountsChanged is emitted on page load...
    // --- if the array of accounts is non-empty, you're already connected.
    ethereum.on('accountsChanged', (accounts) => { handleAccounts(accounts) });
    // set a 'read' flag to true, so we can start any operations that only need to read
    // --- NOTE: may yet be wrong chain

    ethereum.on('disconnect', reloadClient);

    params.currNetwork = await ethereum.request({ method: 'eth_chainId' });

    // await switchNetwork(params.preferredNetwork)

    await addrInit();

    await ethereum
        .request({ method: 'eth_accounts' })
        .then(handleAccounts)
        .catch((err) => {
            // Some unexpected error.
            // For backwards compatibility reasons, if no accounts are available,
            // eth_accounts will return an empty array.
            console.error(err);
        });
}

function updateConnectionStatus(_status = 'static') {
    if (_status == 'read' && params.connection != 'read') { // we've just switched to read
        displayProducts(true);
        if (params.connection != 'write') {
            //updateLiveProductData();
        } else {
            reloadClient()
        }
        params.connection = 'read';
    } else if (_status == 'write' && params.connection != 'write') { // we've just switched to write
        displayProducts(true);
        if (params.connection != 'read') {
            //updateLiveProductData();
        }
        //checkForContracts()
        showConnected()
        params.connection = 'write';
    } else if (_status == 'static' && params.connection != 'static') {  // we've just switched to static
        reloadClient()
    } else {
        throw new Error(`Trying to switch to/from an unknown connection type: ${params.connection} ... ${_status}`);
    }
}

function handleChainChanged(_chainId) {
    localStorage.setItem('reload', `{"last_action": "chain_changed", "timestamp": ${Date.now()}}`);
    // Default when chain changes, reload the page
    reloadClient();
/*    console.log('chain changed to ', _chainId);
    if (params.preferredNetwork != _chainId) {
        throw new Error(`Try switching to a supported chain. ${_chainId} not supported`);    
    };
*/}

function showConnected() {
    document.body.classList.add("connected");
    document.body.classList.remove("disconnected");
    params.walletDiv.innerText = 'Connected';
    params.walletDiv.removeEventListener("click", connect);
//    console.info(`output meh token balance and approval amount`);
//    tokenDisplay();
}

// 'eth_accounts' returns an array
function handleAccounts(accounts) {
    if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        updateConnectionStatus('read');
        prepConnectBtn();
        // in read-mode at this point
        // update connection status
        // provide 'connect' option
        // there is an experimental ethereum._metamask.isUnlocked() that we may use to validate
    } else if (accounts[0] !== params.account) {
        params.account = accounts[0];
        updateConnectionStatus('write');
        // update connection status
        // At this point we should be able to send txs
        // --- no longer stuck in read-mode
    }
    showConnectionInfo();
}

export async function connect() {
    await ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleAccounts)
        .catch((err) => {
            if (err.code === 4001) {
                // EIP-1193 userRejectedRequest error
                // If this happens, the user rejected the connection request.
                console.log('Please connect to MetaMask.');
            } else {
                console.error(err);
            }
            throw new Error(err.message);
        });
}

async function switchNetwork(_chainId = params.preferredNetwork) {
    // Verify this is the desired chain.
    // --- if not, try to switch to desired chain
    // --- try/catch in case that fails due to the chain not being known...in which case try to add
    // --- if we add the chain, may also need to (explicity) switch to it

    if (_chainId != params.currNetwork) {
        await params.provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: _chainId }]
        }).then((out) => {
            handleChainChanged(_chainId);
        }).catch((e) => {
            if (e.code === 4902) {
                //                helpChain(_chainId);
                console.log(`need to add chain ${_chainId}`);
            }
            throw new Error("Could not connect to a supported network");
        });
    };
};

function showConnectionInfo() {
    let infoDiv = document.createElement("div");
    infoDiv.id = "connection_info";
    let _network = chainInfo.find(({ chainId }) => chainId === params.currNetwork);
    // Layer in logic for display of known but unsupported networks, frex Ethereum
    infoDiv.innerHTML = `${(_network) ? _network.chainName : 'unknown'} ${(params.account) ? `(${truncAddr(params.account)})` : ''}`;
    let existingInfoDiv = document.getElementById("connection_info");
    (existingInfoDiv) ? existingInfoDiv.replaceWith(infoDiv) :
        document.getElementById("wallet").insertAdjacentElement('beforeend', infoDiv);
}

export async function getConnectionReady() {
    //is there a provider?
    if (!params.provider) {
//        showErrors("Please use or install a web3 provider like MetaMask");
//        return;
        throw new Error("Please use or install a web3 provider like MetaMask");
    };
    //is there a connected account?
    if (!params.account) {
        try {
           await connect();
        } catch (err) {
//            console.log(err);
//            showErrors(err.message);
//            return;
                throw new Error(err.message);
        }
    };
    //is it on the right chain?
    try {
        await switchNetwork();
    } catch (err) {
//        showErrors(err.message);
//        return;
            throw new Error(err.message);
    };
    return;
};

function truncAddr(addr, limit = 4) {
    if (addr.length <= (limit * 2)) {
        return addr;
    }
    var shortAddr = `${addr.substr(0, limit)}...${addr.substr(limit * -1)}`
    return shortAddr;
};

export async function tokenDisplay() {
    const displayDiv = document.getElementById('wallet');
    params.currApproval = await checkRemainingApproval(params.account);
    params.currMehBalance = await checkMehBalance(params.account);

    displayDiv.insertAdjacentHTML('beforeend',
        `<div id="token_status">
                ${shortenNumber(params.currMehBalance, 2)} Meh
                <a href="https://app.uniswap.org/explore/tokens/base/0xa999542c71febba77602fbc2f784ba9ba0c850f6" target="_blank"><i class="fa-solid fa-circle-plus"></i></a> |
                <span id="meh_approval" class="meh_approval ${(params.currApproval < 25000) && 'low_approval'}">${shortenNumber(params.currApproval)} Approved</span>
                <span id="del_approval"><i class="fa-regular fa-trash-can"></i></span>
            </div>`
    );
    document.getElementById('meh_approval').addEventListener('click', () => { approveMeh(100000000); });
    document.getElementById('del_approval').addEventListener('click', () => { removeApproval() });
}
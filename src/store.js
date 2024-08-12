import { params } from './main.js';
import {
    MEH_VOTE,
    MEH_TOKEN,
    MEH_STORE,
    MEH_STORE_NFT,
    USDC_TOKEN,
    web3,
    MEHToken,
    MEHVote,
    USDCToken,
    MEHStore,
    MEHStoreNFT
} from './addr.js';
import { product } from './product.js';
import {
    calcGas
    , checkUSDCBalance
    , cleanBigInt
    , getAccounts
    , showErrors
    , showSuccess
    , addrForm
    , RSAencrypt
//    , showWaiting
} from './common.js';
import { getConnectionReady } from './wallet.js';

let products = [];

export async function loadStaticProductData() {
    products = [];

    await fetch(new Request(`./data/products_${params.gameId}.json`))
        .then((response) => response.json())
        .then(async (data) => {
            for (const _product of data) {
                products.push(new product({
                    id: Number(_product.id),
                    storeId: Number(_product.storeId),
                    name: _product.name,
                    contractsDeposited: _product.mehContractsDeposited ? Number(_product.mehContractsDeposited) : null, // meh contracts deposited
                    mehContracts: Number(_product.mehContracts),
                    contractPrice: cleanBigInt(_product.mehContractPrice, params.tokenScale),
                    prizeMeh: cleanBigInt(_product.prizeMeh, params.tokenScale),
                    mehStore: _product.mehStore,
                    usdcPrice: Number(_product.usdcPrice),
                    begin: Number(_product.begin),
                    end: Number(_product.end),
                    limitedRun: _product.limitedRun,
                    totalContracts: Number(_product.totalContracts),
                    saleStatus: _product.saleStatus,
                    order_min: Number(_product.order_min),
                    details: _product.meta
                }));
            }
            // sort by product begin
            products = products.sort(function (a, b) { return a.id - b.id });

            let lastProductEnd = products.reduce((maxEnd, currProduct) => { return (currProduct.end > maxEnd.end) ? currProduct : maxEnd })
            if (params.gameEnd < lastProductEnd.end) {
                params.gameEnd = lastProductEnd.end;
            }
        })
        .catch(console.error);

    for (const _product of products) {
        await _product.asyncInit();
    }
    window.products = products;

    await displayProducts();
}

export async function displayProducts(regenHTML = false) {
    params.contentDiv.innerHTML = '';
    params.contentDiv.insertAdjacentHTML('beforeend', `<div id="products"></div>`);
    const productsDiv = document.getElementById("products");
    params.contentDiv.insertAdjacentHTML('beforeend', `<div id="coming_soon"></div>`);
    const comingDiv = document.getElementById("coming_soon");

    for (const _product of products) {
        if (regenHTML) { _product.genHtml(); }
        const target = (_product.saleStatus == 'active') ? productsDiv : comingDiv;
        target.insertAdjacentElement('beforeend', _product.html);
    };
}

export async function waitForTx(_txId, _maxWait = 30) { //max wait in seconds
    return new Promise((resolve, reject) => {
        //        console.log("waitForTx",_txId,_maxWait);
        let loopSpeed = 2; // loop speed in seconds
        //const txComplete = false;
        const timer = setTimeout(() => {
            reject(new Error(`transaction not complete after ${_maxWait} seconds`));
        }, _maxWait * 1000);
        const interval = setInterval(() => {
            ethereum.request({
                "method": "eth_getTransactionReceipt",
                "params": [_txId]
            }).then(function (receipt) {
                if (receipt) {
                    //                    console.info(`transaction complete: ${_txId}`,receipt);
                    clearTimeout(timer);
                    clearInterval(interval);
                    resolve();
                }
            });
        }, loopSpeed * 1000);
        console.info(`waiting for tx`);
    });
};

export async function approveMeh(amt) {
    const accounts = await getAccounts();
    if (accounts.length <= 0) {
        throw new Error("connect to metamask");
    }

    var amtWei = web3.utils.toWei(amt.toString(), 'ether');

    let gas = {}
    try {
        gas = await calcGas({
            account: accounts[0],
            context: MEHToken.methods,
            func: 'approve',
            args: [MEH_VOTE, amtWei]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': accounts[0],
        'to': MEH_TOKEN,
        'data': MEHToken.methods.approve(MEH_VOTE, amtWei).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };

    const txHash = await params.provider.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(result => {
        showSuccess('approve tx complete', result);
        params.transactionQueue.push(result);
        //        updateMehApproval(amt);
    }, error => {
        showErrors(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
}

async function approveUSDC(amt) {
    var amtWei = web3.utils.toWei(amt.toString(), 'mwei');

    let gas = {}
    try {
        gas = await calcGas({
            account: params.account,
            context: USDCToken.methods,
            func: 'approve',
            args: [MEH_STORE, amtWei]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': params.account,
        'to': USDC_TOKEN,
        'data': USDCToken.methods.approve(MEH_STORE, amtWei).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };

    let txHash = await params.provider.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then((result) => {
        return result;
    }).catch((error) => {
        showErrors(error.message);
        throw error;
    });
    return txHash;
}

export async function approveMehNFT() {
    let gas = {}
    try {
        gas = await calcGas({
            account: params.account,
            context: MEHStoreNFT.methods,
            func: 'setApprovalForAll',
            args: [MEH_STORE, true]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': params.account,
        'to': MEH_STORE_NFT,
        'data': MEHStoreNFT.methods.setApprovalForAll(MEH_STORE, true).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };

    let txHash = await params.provider.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then((result) => {
        return result;
    }).catch((error) => {
        showErrors(error.message);
        throw error;
    });
    return txHash;
}

export async function NFTtoProduct({ _nftId, _address }) {
    let gas = {}
    try {
        gas = await calcGas({
            account: params.account,
            context: MEHStoreNFT.methods,
            func: 'enterDeliveryAddress',
            args: [_nftId, _address]
        })
    } catch (e) {
        console.error('WTF:', e);
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': params.account,
        'to': MEH_STORE_NFT,
        'data': MEHStoreNFT.methods.enterDeliveryAddress(_nftId, _address).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };

    let txHash = await params.provider.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then((result) => {
        return result;
    }).catch((error) => {
        showErrors(error.message);
        throw error;
    });
    return txHash;
}

export async function purchaseProductNFT(_productID, _discount = false) {
    let gas = {}
    try {
        gas = await calcGas({
            account: params.account,
            context: MEHStore.methods,
            func: 'purchaseProduct',
            args: [_productID, '', _discount]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': params.account,
        'to': MEH_STORE,
        'data': MEHStore.methods.purchaseProduct(_productID, '', _discount).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };

    let txHash = await params.provider.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then((result) => {
        return result;
    }).catch((error) => {
        showErrors(error.message);
        throw error;
    });
    return txHash;
}

export async function purchaseProcess({ _USDCprice, _productId }) {
//    console.info(`VERIFY ... cancelling tx at any step throws error and stops function.`);
    // Instead of nesting all these fx().then().catch() ... maybe make a try/catch block with sequential await calls
    // might make sense to use toastify-js here, for steps/status
    let nftId;
    await getConnectionReady()
        .then(async () => {
            console.info('✓ connection ready');
            let usdcBalance = await checkUSDCBalance(params.account);   // Check USDC balance
            console.info(`✓ got usdcBalance (${usdcBalance})`);
            if (_USDCprice > usdcBalance) {
                showErrors('You do not have enough USDC in your wallet.');
                throw new Error('Not enough USDC');
            } else {
                console.info(`✓ Sufficient USDC balance`);
            };
            approveUSDC(_USDCprice).then(async (tx) => {    // get USDC approval
                console.info(`✓ USDC approved`);
//                let approvalWait = showWaiting();
                await waitForTx(tx).then(async () => {
//console.log(approvalWait)
//                            approvalWait.hideToast();
                    console.info(`✓ USDC approval tx complete on-chain`);
                    await purchaseProductNFT(_productId)
                        .then(async (_tx) => {
                            console.info(`✓ NFT purchased`);
//                            let purchaseWait = showWaiting();
                            await waitForTx(_tx).then(async () => {
//console.log(purchaseWait)//                                purchaseWait.remove();
                                console.info(`✓ NFT purchase tx complete on-chain`);
                                products.find(product => product.storeId == _productId).markPurchased();
                                showSuccess('NFT purchase successful!', _tx);
                            }).catch((e) => {
                                throw new Error(e.message);
                            });
                        })
                        .catch((e) => { // purchase NFT
                            throw new Error(e.message);
                        });
                }).catch((e) => {
                    throw new Error(e.message);
                });
            }).catch((e) => {
                throw new Error(e.message);
            });
        }).catch((e) => {
            console.log('connection issue:', e)
            showErrors(e.message);
        });
}

export async function getPhysicalProduct(_nftId) {
//    console.info(`VERIFY ... cancelling tx at any step throws error and stops function.`);
    // Instead of nesting all these fx().then().catch() ... maybe make a try/catch block with sequential await calls
    let nftId;
    await getConnectionReady()
        .then(async () => {
            console.info('✓ connection ready');
            // check for approval
           // remove product from NFT list & show success message
            await approveMehNFT().then(async (_tx) => {
                console.info(`✓ NFT approved`);
                await waitForTx(_tx).then(async () => {
                    console.info(`✓ NFT approval tx complete on-chain`);
                    await addrForm('Send').then(async (_form_data) => {
                        console.info(`✓ Address form submitted`);
                        await NFTtoProduct({ _nftId, _address: await RSAencrypt(_form_data) })
                            .then(async (_tx) => {
                                console.info(`✓ NFT submitted to store, with addr`);
                                await waitForTx(_tx).then(async () => {
                                    console.info(`✓ NFT Store tx complete on-chain`);
                                    document.getElementById('nft_' + _nftId).remove();
                                    showSuccess('Product purchased', _tx);
                                    // remove product from list & show success message                  products.find(product => product.storeId == _productId).markPurchased();
                                }).catch((e) => {
                                    throw new Error(e.message);
                                });
                            }).catch((e) => {
                                throw new Error(e.message);
                            });
                    }).catch((e) => {
                        throw new Error(e.message);
                    });
                }).catch((e) => {
                    throw new Error(e.message);
                });
            }).catch((e) => {
                throw new Error(e.message);
            });
        }).catch((e) => {
            throw new Error(e.message);
        });
};


export async function claim(_productId) {
    const accounts = await getAccounts();
    if (accounts.length <= 0) {
        showErrors("connect a provider like metamask");
        throw new Error("connect to metamask");
    }

    let gas = {}
    try {
        gas = await calcGas({
            account: accounts[0],
            context: MEHVote.methods,
            func: 'claim',
            args: [params.gameId, _productId]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': accounts[0],
        'to': MEH_VOTE,
        'data': MEHVote.methods.claim(params.gameId, _productId).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };
    const txHash = await params.provider.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(async result => {
        showSuccess('approve tx complete', result);
        params.transactionQueue.push(result);
    }, error => {
        showErrors(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
};

export function updateLiveProductData() {
    let gameProducts = MEHVote.methods.getProductsByGameId(params.gameId).call()
        .then((data) => {
            for (const _product of data) {
                //            products[index].updateContracts({_deposited: Number(_product.mehContractsDeposited)})
                products.find(product => product.id == _product.id).updateContracts({ _deposited: Number(_product.mehContractsDeposited) })
            }
            displayProducts(true);
        });
}

export function checkForContracts() {
    for (const _product of products) {
        _product.checkForOwnedContracts();
    };
}

export async function getProductImageFromProductId(_productId) {
    return products.find(product => product.storeId == _productId).image;
}

// ****************************
// SAMPLE / TEST CODE BELOW
// ****************************

//window.MEHToken = MEHToken;
//window.MEHVote = MEHVote;
//window.vote = vote;
//window.loadStaticProductData = loadStaticProductData;
window.addrForm = addrForm;
window.NFTtoProduct = NFTtoProduct;

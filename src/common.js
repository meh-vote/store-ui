import { params } from "./main.js";
import { MEHToken, USDCToken, MEH_VOTE, MEH_TOKEN, etherscan, web3 } from "./addr.js";
import { loadMyNFTs } from "./nfts.js";

export function cleanBigInt(_bigInt, _divisor = 1) {
    return Math.round(Number(_bigInt) / _divisor);
};

export function shortenNumber(_longNum, _dec = 0) {
    return (_longNum >= 1000000000) ?
        Number(_longNum / 1000000000).toFixed(_dec) + "B" :
        (_longNum >= 1000000) ?
            Number(_longNum / 1000000).toFixed(_dec) + "M" :
            (_longNum >= 1000) ?
                Number(_longNum / 1000).toFixed(_dec) + "K" : _longNum;
}

export function reloadClient() {
    window.location.reload();
}

export async function getAccounts() {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    return accounts;
}

export function showErrors(_message, _stop = false) {
    console.error(_message);
    let div = document.createElement("div");
    div.id = "overlay";
    document.body.insertAdjacentElement('beforeend', div);
    div.innerHTML = `<div id="overlay_content">${_message}</div>`;
    document.body.classList.add("overlay_on");

    if (_stop) {
        throw new Error(_message);
    } else {
        setTimeout(() => {
            document.getElementById("overlay").remove();
            document.body.classList.remove("overlay_on");
        }, 5000);
    }
}

export function showSuccess(_message, link = null) {
    let div = document.createElement("div");
    div.id = "overlay";
    document.body.insertAdjacentElement('beforeend', div);
    if (link) {
        div.innerHTML = `<div id="overlay_content">${_message}<br /><a href="https://${etherscan}/tx/${link}" target="_blank">${link}</a></div>`;
    } else {
        div.innerHTML = _message;
    }
    document.body.classList.add("overlay_on");

    setTimeout(() => {
        document.getElementById("overlay").remove();
        document.body.classList.remove("overlay_on");
    }, 5000);
    //console.log(_message);
}

// **********************
// Connection helpers
// **********************

export function helpProvider() {
    params.contentDiv.innerHTML =
        `<div>Meh is a d/app and requires a web3 provider,
        like <a href="https://metamask.io/download/" target="_blank">MetaMask</a>,
        <a href="https://trustwallet.com/" target="_blank">Trust Wallet</a>,
        or <a href="https://www.coinbase.com/wallet" target="_blank">Coinbase Wallet</a>.</div>`;
};

export async function helpChain(_chainId = defaultChainId) { // for now we assume Base
    if (params.provider) {
        try {
            await params.provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: _chainId, // A hexadecimal string representing the chain ID. For example, Ethereum Mainnet is 0x1
                    chainName: (_chainId == '0x14a34') ? 'Base Sepolia' : 'Base', // A human-readable name for the chain
                    rpcUrls: [`https://${(_chainId == '0x14a34') ? 'sepolia.base.org' : 'mainnet.base.org'}`], // An array of RPC URLs the wallet can use
                    nativeCurrency: {
                        name: 'Ether', // The currency the chain uses
                        symbol: 'ETH', // The currency symbol
                        decimals: 18 // The number of decimals the currency uses
                    },
                    blockExplorerUrls: [`https://${(_chainId == '0x14a34') ? 'sepolia-explorer.base.org' : 'basescan.org'}`] // An array of URLs to block explorers for this chain
                }]
            });
            console.info('Chain added or switched successfully.');
        } catch (error) {
            console.error('Failed to add the chain', error);
        }
    } else {
        console.error('Ethereum provider is not available. Install MetaMask!');
    }
};

// this needs cleanup before use vvv
export async function helpToken() {
    await window.ethereum.request({
        "method": "wallet_watchAsset",
        "params": {
            "type": "ERC20",
            "options": {
                "address": MEH_TOKEN,
                "symbol": "MEH",
                "decimals": 18,
                "image": "/images/meh_token.png"
            }
        }
    });
};

export function helpApproval(_amount) {
};

export async function removeApproval(_wallet) {
    const accounts = await getAccounts();
    if (accounts.length <= 0) {
        throw new Error("connect to metamask");
    }

    let gas = {}
    try {
        gas = await calcGas({
            account: accounts[0],
            context: MEHToken.methods,
            func: 'approve',
            args: [MEH_VOTE, 0]
        })
    } catch (e) {
        showErrors(`${e.message}`);
        return;
    };

    const tx = {
        'from': accounts[0],
        'to': MEH_TOKEN,
        'data': MEHToken.methods.approve(MEH_VOTE, 0).encodeABI(),
        'gas': web3.utils.toHex(gas.estimatedGas),
        'gasPrice': web3.utils.toHex(gas.gasPrice)
    };

    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx],
    }).then(result => {
        showSuccess('remove approval tx complete', result);
        params.transactionQueue.push(result);
        //        updateMehApproval(amt);
    }, error => {
        showErrors(error.message)
    }).finally(() => {
        // any wrap-up actions
    });

    return txHash;
};

export async function checkRemainingApproval(_wallet) {
    let approval = await MEHToken.methods.allowance(_wallet, MEH_VOTE).call().then((_meh) => { return cleanBigInt(_meh, params.tokenScale); });
    return approval;
};

export async function checkMehBalance(_wallet) {
    let balance = await MEHToken.methods.balanceOf(_wallet).call().then((result) => { return cleanBigInt(result, params.tokenScale) });
    return balance;
};

export async function checkUSDCBalance(_wallet) {
    let balance = await USDCToken.methods.balanceOf(_wallet).call().then((result) => { return cleanBigInt(result, params.USDCScale) });
    return balance;
};

export async function calcGas({ account, context, func, args = null }) {
    let gasPrice = await getGasPrice();
    gasPrice = Math.trunc(Number(gasPrice) * 1.5);

    let estimatedGas = await context[func].apply(null, args ? args : null).estimateGas({ from: account })
        .catch((error) => { throw new Error(error.message); });

    return { gasPrice, estimatedGas };
}

async function getGasPrice() {
    const price = await web3.eth.getGasPrice();
    //    console.log(`Checking gas:`,price);
    return price;
}

export async function RSAencrypt(_JSONdata) {
    let encrypted;
    await crypto.subtle.importKey('jwk', JSON.parse('{"alg":"RSA-OAEP-256","e":"AQAB","ext":true,"key_ops":["encrypt"],"kty":"RSA","n":"p4KdeTAnCqFRKDfwaAR1tL6agO3NugvD1Zwh2VooC9h-TFbOnhUHYUU_f5sL7oN5rXNEieRHsp2px07woUXID1b5u268texHa43STuePvq3YdBLDnyUCse2f_brXo9yGDzWHCzexujk5WbAgscCygYkmKZIHh47ZjFLHdwvqyqqUMXl66TZGdtjNxq9KthHcmXY4xg-Bzg715K4kMumjw4CqwnlNz_NuRURNsmCbss_jZMUEg8mOirekMXxr_2F4gRERXCHRI-UqP1ThEBe68WEp8a3rGJ_P9E_ErCd-Eyv6x3qMVRH_hv5cBT0KYgKF1MujelhtW12mdiyOpnT7pi8LWIEp3bCSeVSV5mdYzpKWccin3iIpVJhY2E_hqPBEfIvIinox0FUPzupFGxNZn0wIumcBcR2y0i2pEMfwNStgi83QMRsEeh0gWOATVnaR4ZJsc8Jl0mEl86WyIbJ4WWJJmnM7N1LbWyVKKJDvHOWntMhsSY1X_tgNexXXEA1zHNBGkqTqAIJekdEdwZio0mgNaK3DwKAfwXRd1HbyZXvN_bvUYPA-p57c8LiZc7KE4xTutchv2bsQgR96DU6AoH8CPEs6HUxjgNGlauaWxC6x2KGVL0a0c3Wmiv-jip6vMNjD4qEW0KrzSuvPkq6OEg1hg0qw7UDUU2piGbmwVck"}'), {
        name: "RSA-OAEP",
        hash: "SHA-256",
    }, false, ['encrypt']).then(async (e) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(_JSONdata));
        await crypto.subtle.encrypt({
            name: "RSA-OAEP",
            hash: "SHA-256",
        }, e, data).then((x) => {
            encrypted = new Uint8Array(x).toString();
        });
    });
    return encrypted;
};

export function addrForm(btn_label = 'Submit') {
    return new Promise((resolve, reject) => {
        let div = document.createElement("div");
        div.id = "overlay";
        document.body.insertAdjacentElement('beforeend', div);
        div.innerHTML = `<div class="wrapper" id="overlay_content">
    <form id="get_address">
      <div>
        <label for="name">Name</label>
        <input required type="text" id="name" name="name" autocomplete="name" enterkeyhint="next">
      </div>
      <div>
        <label for="street-address">Street address</label>
        <input type="text" id="street-address" name="street-address" autocomplete="street-address" required enterkeyhint="next"></input>
      
      </div>
      <div>
        <label for="postal-code">ZIP or postal code (optional)</label>
        <input class="postal-code" id="postal-code" name="postal-code" autocomplete="postal-code" enterkeyhint="next">
      </div>
      <div>
        <label for="city">City</label>
        <input required type="text" id="city" name="city" autocomplete="address-level2" enterkeyhint="next">
      </div>
      <div>
        <label for="state">State or province</label>
        <input required type="text" id="state" name="state" autocomplete="address-level1" enterkeyhint="next">
      </div>
      <div>
        <label for="country">Country or region</label>
        <select id="country" name="country" autocomplete="country" enterkeyhint="done" required>
            <option></option>
            <option value="BE">Belgium</option>
            <option value="CA">Canada</option>
            <option value="DK">Denmark</option>
            <option value="FR">France</option>
            <option value="DE">Germany</option>
            <option value="IT">Italy</option>
            <option value="JP">Japan</option>
            <option value="NL">Netherlands</option>
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
        </select> 
      </div>
      <button class="btn_meh_dark">Send</button>
    </form>
  </div>`;
        document.body.classList.add("overlay_on");

        document.getElementById('overlay_content').insertAdjacentHTML('beforeend', `<div id="close">X</div>`);

        document.getElementById('close').addEventListener('click', () => {
            document.getElementById("overlay").remove();
            document.body.classList.remove("overlay_on");
            reject(new Error('User closed address form.'));
        });

        document.getElementById('get_address').addEventListener('submit', (_form) => {
            _form.preventDefault();
            document.getElementById("overlay").remove();
            document.body.classList.remove("overlay_on");

            const data = new FormData(_form.target);
            const _form_data = Object.fromEntries(data.entries());
            // the above only accounts for single-value fields/elements
            resolve(_form_data);
        });
    });
}

export function showFAB() {
    let fab = document.createElement("div");
    fab.id = "fab";
/*    fab.innerHTML =
        `<input id="fabCheckbox" type="checkbox" class="fab-checkbox" />
        <label class="fab" for="fabCheckbox">
            <span class="fab-dots fab-dots-1"></span>
            <span class="fab-dots fab-dots-2"></span>
            <span class="fab-dots fab-dots-3"></span>
        </label>
        <div class="fab-wheel">
            <a class="fab-action fab-action-1">
                <i class="fa-solid fa-question"></i>
                <i class="fa-solid fa-question"></i>
            </a>
            <a class="fab-action fab-action-2">
                <i class="fas fa-book"></i>
            </a>
            <a class="fab-action fab-action-3">
                <i class="fas fa-address-book"></i>
            </a>
            <a class="fab-action fab-action-4">
                <i class="fas fa-info"></i>
            </a>
        </div>`;
*/
    fab.innerHTML = `<span class="meh_button">MY NFTS</span>`;
    fab.addEventListener('click', () => { loadMyNFTs(); }); // TEMP

    document.body.insertAdjacentElement('beforeend', fab);
};

window.showSuccess = showSuccess;
window.showErrors = showErrors;
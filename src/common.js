import { params } from "./main.js";
import { MEHToken, USDCToken,MEH_VOTE, MEH_TOKEN, etherscan, web3 } from "./addr.js";

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
    let balance = await MEHToken.methods.balanceOf(_wallet).call().then((result) => {return cleanBigInt(result,params.tokenScale)});
    return balance;
};

export async function checkUSDCBalance(_wallet) {
    let balance = await USDCToken.methods.balanceOf(_wallet).call().then((result) => {return cleanBigInt(result,params.USDCScale)});
    return balance;
};

export async function calcGas({account, context, func, args = null}) {
    let gasPrice = await getGasPrice();
    gasPrice = Math.trunc(Number(gasPrice) * 1.5);
  
    let estimatedGas = await context[func].apply(null,args?args:null).estimateGas({from: account})
      .catch((error) => {throw new Error(error.message);});
  
    return {gasPrice,estimatedGas};
}

async function getGasPrice() {
    const price = await web3.eth.getGasPrice();
//    console.log(`Checking gas:`,price);
    return price;
}

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
        <label for="country">Country or region</label>
        <select id="country" name="country" autocomplete="country" enterkeyhint="done" required>
            <option></option>
            <option value="AF">Afghanistan</option>
            <option value="AX">Åland Islands</option>
            <option value="AL">Albania</option>
            <option value="DZ">Algeria</option>
            <option value="AS">American Samoa</option>
            <option value="AD">Andorra</option>
            <option value="AO">Angola</option>
            <option value="AI">Anguilla</option>
            <option value="AQ">Antarctica</option>
            <option value="AG">Antigua &amp; Barbuda</option>
            <option value="AR">Argentina</option>
            <option value="AM">Armenia</option>
            <option value="AW">Aruba</option>
            <option value="AC">Ascension Island</option>
            <option value="AU">Australia</option>
            <option value="AT">Austria</option>
            <option value="AZ">Azerbaijan</option>
            <option value="BS">Bahamas</option>
            <option value="BH">Bahrain</option>
            <option value="BD">Bangladesh</option>
            <option value="BB">Barbados</option>
            <option value="BY">Belarus</option>
            <option value="BE">Belgium</option>
            <option value="BZ">Belize</option>
            <option value="BJ">Benin</option>
            <option value="BM">Bermuda</option>
            <option value="BT">Bhutan</option>
            <option value="BO">Bolivia</option>
            <option value="BA">Bosnia &amp; Herzegovina</option>
            <option value="BW">Botswana</option>
            <option value="BV">Bouvet Island</option>
            <option value="BR">Brazil</option>
            <option value="IO">British Indian Ocean Territory</option>
            <option value="VG">British Virgin Islands</option>
            <option value="BN">Brunei</option>
            <option value="BG">Bulgaria</option>
            <option value="BF">Burkina Faso</option>
            <option value="BI">Burundi</option>
            <option value="KH">Cambodia</option>
            <option value="CM">Cameroon</option>
            <option value="CA">Canada</option>
            <option value="CV">Cape Verde</option>
            <option value="BQ">Caribbean Netherlands</option>
            <option value="KY">Cayman Islands</option>
            <option value="CF">Central African Republic</option>
            <option value="TD">Chad</option>
            <option value="CL">Chile</option>
            <option value="CN">China</option>
            <option value="CX">Christmas Island</option>
            <option value="CC">Cocos (Keeling) Islands</option>
            <option value="CO">Colombia</option>
            <option value="KM">Comoros</option>
            <option value="CG">Congo - Brazzaville</option>
            <option value="CD">Congo - Kinshasa</option>
            <option value="CK">Cook Islands</option>
            <option value="CR">Costa Rica</option>
            <option value="CI">Côte d'sIvoire</option>
            <option value="HR">Croatia</option>
            <option value="CW">Curaçao</option>
            <option value="CY">Cyprus</option>
            <option value="CZ">Czechia</option>
            <option value="DK">Denmark</option>
            <option value="DJ">Djibouti</option>
            <option value="DM">Dominica</option>
            <option value="DO">Dominican Republic</option>
            <option value="EC">Ecuador</option>
            <option value="EG">Egypt</option>
            <option value="SV">El Salvador</option>
            <option value="GQ">Equatorial Guinea</option>
            <option value="ER">Eritrea</option>
            <option value="EE">Estonia</option>
            <option value="SZ">Eswatini</option>
            <option value="ET">Ethiopia</option>
            <option value="FK">Falkland Islands (Islas Malvinas)</option>
            <option value="FO">Faroe Islands</option>
            <option value="FJ">Fiji</option>
            <option value="FI">Finland</option>
            <option value="FR">France</option>
            <option value="GF">French Guiana</option>
            <option value="PF">French Polynesia</option>
            <option value="TF">French Southern Territories</option>
            <option value="GA">Gabon</option>
            <option value="GM">Gambia</option>
            <option value="GE">Georgia</option>
            <option value="DE">Germany</option>
            <option value="GH">Ghana</option>
            <option value="GI">Gibraltar</option>
            <option value="GR">Greece</option>
            <option value="GL">Greenland</option>
            <option value="GD">Grenada</option>
            <option value="GP">Guadeloupe</option>
            <option value="GU">Guam</option>
            <option value="GT">Guatemala</option>
            <option value="GG">Guernsey</option>
            <option value="GN">Guinea</option>
            <option value="GW">Guinea-Bissau</option>
            <option value="GY">Guyana</option>
            <option value="HT">Haiti</option>
            <option value="HM">Heard &amp; McDonald Islands</option>
            <option value="HN">Honduras</option>
            <option value="HK">Hong Kong</option>
            <option value="HU">Hungary</option>
            <option value="IS">Iceland</option>
            <option value="IN">India</option>
            <option value="ID">Indonesia</option>
            <option value="IR">Iran</option>
            <option value="IQ">Iraq</option>
            <option value="IE">Ireland</option>
            <option value="IM">Isle of Man</option>
            <option value="IL">Israel</option>
            <option value="IT">Italy</option>
            <option value="JM">Jamaica</option>
            <option value="JP">Japan</option>
            <option value="JE">Jersey</option>
            <option value="JO">Jordan</option>
            <option value="KZ">Kazakhstan</option>
            <option value="KE">Kenya</option>
            <option value="KI">Kiribati</option>
            <option value="XK">Kosovo</option>
            <option value="KW">Kuwait</option>
            <option value="KG">Kyrgyzstan</option>
            <option value="LA">Laos</option>
            <option value="LV">Latvia</option>
            <option value="LB">Lebanon</option>
            <option value="LS">Lesotho</option>
            <option value="LR">Liberia</option>
            <option value="LY">Libya</option>
            <option value="LI">Liechtenstein</option>
            <option value="LT">Lithuania</option>
            <option value="LU">Luxembourg</option>
            <option value="MO">Macao</option>
            <option value="MG">Madagascar</option>
            <option value="MW">Malawi</option>
            <option value="MY">Malaysia</option>
            <option value="MV">Maldives</option>
            <option value="ML">Mali</option>
            <option value="MT">Malta</option>
            <option value="MH">Marshall Islands</option>
            <option value="MQ">Martinique</option>
            <option value="MR">Mauritania</option>
            <option value="MU">Mauritius</option>
            <option value="YT">Mayotte</option>
            <option value="MX">Mexico</option>
            <option value="FM">Micronesia</option>
            <option value="MD">Moldova</option>
            <option value="MC">Monaco</option>
            <option value="MN">Mongolia</option>
            <option value="ME">Montenegro</option>
            <option value="MS">Montserrat</option>
            <option value="MA">Morocco</option>
            <option value="MZ">Mozambique</option>
            <option value="MM">Myanmar (Burma)</option>
            <option value="NA">Namibia</option>
            <option value="NR">Nauru</option>
            <option value="NP">Nepal</option>
            <option value="NL">Netherlands</option>
            <option value="NC">New Caledonia</option>
            <option value="NZ">New Zealand</option>
            <option value="NI">Nicaragua</option>
            <option value="NE">Niger</option>
            <option value="NG">Nigeria</option>
            <option value="NU">Niue</option>
            <option value="NF">Norfolk Island</option>
            <option value="KP">North Korea</option>
            <option value="MK">North Macedonia</option>
            <option value="MP">Northern Mariana Islands</option>
            <option value="NO">Norway</option>
            <option value="OM">Oman</option>
            <option value="PK">Pakistan</option>
            <option value="PW">Palau</option>
            <option value="PS">Palestine</option>
            <option value="PA">Panama</option>
            <option value="PG">Papua New Guinea</option>
            <option value="PY">Paraguay</option>
            <option value="PE">Peru</option>
            <option value="PH">Philippines</option>
            <option value="PN">Pitcairn Islands</option>
            <option value="PL">Poland</option>
            <option value="PT">Portugal</option>
            <option value="PR">Puerto Rico</option>
            <option value="QA">Qatar</option>
            <option value="RE">Réunion</option>
            <option value="RO">Romania</option>
            <option value="RU">Russia</option>
            <option value="RW">Rwanda</option>
            <option value="WS">Samoa</option>
            <option value="SM">San Marino</option>
            <option value="ST">São Tomé &amp; Príncipe</option>
            <option value="SA">Saudi Arabia</option>
            <option value="SN">Senegal</option>
            <option value="RS">Serbia</option>
            <option value="SC">Seychelles</option>
            <option value="SL">Sierra Leone</option>
            <option value="SG">Singapore</option>
            <option value="SX">Sint Maarten</option>
            <option value="SK">Slovakia</option>
            <option value="SI">Slovenia</option>
            <option value="SB">Solomon Islands</option>
            <option value="SO">Somalia</option>
            <option value="ZA">South Africa</option>
            <option value="GS">South Georgia &amp; South Sandwich Islands</option>
            <option value="KR">South Korea</option>
            <option value="SS">South Sudan</option>
            <option value="ES">Spain</option>
            <option value="LK">Sri Lanka</option>
            <option value="BL">St Barthélemy</option>
            <option value="SH">St Helena</option>
            <option value="KN">St Kitts &amp; Nevis</option>
            <option value="LC">St Lucia</option>
            <option value="MF">St Martin</option>
            <option value="PM">St Pierre &amp; Miquelon</option>
            <option value="VC">St Vincent &amp; Grenadines</option>
            <option value="SR">Suriname</option>
            <option value="SJ">Svalbard &amp; Jan Mayen</option>
            <option value="SE">Sweden</option>
            <option value="CH">Switzerland</option>
            <option value="TW">Taiwan</option>
            <option value="TJ">Tajikistan</option>
            <option value="TZ">Tanzania</option>
            <option value="TH">Thailand</option>
            <option value="TL">Timor-Leste</option>
            <option value="TG">Togo</option>
            <option value="TK">Tokelau</option>
            <option value="TO">Tonga</option>
            <option value="TT">Trinidad &amp; Tobago</option>
            <option value="TA">Tristan da Cunha</option>
            <option value="TN">Tunisia</option>
            <option value="TR">Turkey</option>
            <option value="TM">Turkmenistan</option>
            <option value="TC">Turks &amp; Caicos Islands</option>
            <option value="TV">Tuvalu</option>
            <option value="UG">Uganda</option>
            <option value="UA">Ukraine</option>
            <option value="AE">United Arab Emirates</option>
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
            <option value="UY">Uruguay</option>
            <option value="UM">US Outlying Islands</option>
            <option value="VI">US Virgin Islands</option>
            <option value="UZ">Uzbekistan</option>
            <option value="VU">Vanuatu</option>
            <option value="VA">Vatican City</option>
            <option value="VE">Venezuela</option>
            <option value="VN">Vietnam</option>
            <option value="WF">Wallis &amp; Futuna</option>
            <option value="EH">Western Sahara</option>
            <option value="YE">Yemen</option>
            <option value="ZM">Zambia</option>
            <option value="ZW">Zimbabwe</option>
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


window.showSuccess = showSuccess;
window.showErrors = showErrors;
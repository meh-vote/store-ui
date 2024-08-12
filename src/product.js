import { shortenNumber, showErrors } from './common.js';
import { params } from './main.js';
import { web3, MEHVote } from './addr.js';
import { purchaseProcess } from './store.js';

export class product {
    constructor({
        id,
        storeId = null,
        name = null,
        contractsDeposited = null, // meh contracts deposited
        mehContracts = null,
        contractPrice = null,
        prizeMeh = 0,
        mehStore = false,
        usdcPrice = null,
        begin = null,
        end = null,
        limitedRun = true,
        totalContracts = null,
        saleStatus = null,
        order_min = null,
        details = {},
        options = null
    }) {
        this.id = id;
        this.storeId = storeId;
        this.name = name;
        this.contractsDeposited = contractsDeposited; // meh contracts deposited
        this.mehContracts = isNaN(mehContracts) ? 0 : mehContracts;
        this.contractPrice = isNaN(contractPrice) ? null : (contractPrice < 1) ? 1 : contractPrice;
        this.prizeMeh = prizeMeh;
        this.mehStore = mehStore;
        this.usdcPrice = usdcPrice;
        this.begin = Number(begin) * 1000;
        this.end = Number(end) * 1000;
        this.remainingContracts = (mehContracts && contractsDeposited) ? ((mehContracts && (mehContracts - contractsDeposited) > 0) ? mehContracts - contractsDeposited : 0) : null;
        this.soldOut = (this.remainingContracts && this.remainingContracts == 0) ? true : false;
        this.limitedRun = limitedRun;
        this.html = null;
        this.image = `/images/product/id_${this.id}.png`;
        this.totalContracts = isNaN(totalContracts) ? 0 : totalContracts;
        this.activeStatus = 2; // 0: not yet open, 1: active, 2: product has closed
        this.setActiveState();
        this.contractsOwned = null;
        this.saleStatus = saleStatus;
        this.preorderMin = order_min;
        this.details = details;
        this.options = options;
        // Need to hold on displaying the remaining contracts until we have a read connection and check the live data
        //        console.log(`contractsDeposited ${this.contractsDeposited}`)
    };

    genHtml() {
        this.html = document.createElement('div');
        this.html.className = 'product';
        this.html.style.backgroundImage = `url(${this.image})`;
        this.html.id = `product_${this.id}`;

        // FOR STYLING, SHOW AS PRESALE STATE
        if (this.saleStatus == 'active') {
            this.html.insertAdjacentHTML('beforeend',
                `<div class="product_details">
                    ${(this.details.description)
                        ?`<div class="description">${this.details.description}</div>`
                        :''}
                    ${(this.details.material)
                        ?`<div class="materil">// ${this.details.material}</div>`
                        :''}
                    ${(this.details.coo)
                        ?`<div class="origin">// origin: ${this.details.coo}</div>`
                        :''}
                </div>
                <div class="base_info">
                    <div class="title">${this.name}</div>
                    <div class="price"><strong>${this.usdcPrice}</strong>USDC</div>
                </div>`);

            this.html.insertAdjacentHTML('afterbegin', `<span id="buy_nft_${this.id}" class="buy_nft meh_button">BUY</span>`);
            this.html.getElementsByClassName(`buy_nft`)[0].addEventListener('click', async (evt) => {
                evt.stopImmediatePropagation();
                await purchaseProcess({_USDCprice: this.usdcPrice, _productId: this.storeId}).catch((e) => {
                    showErrors(e.message);
                });
            })

            if (this.contractsOwned && this.contractsOwned > 0) {
                if (this.soldOut) {
                    this.html.insertAdjacentHTML('afterbegin', `<span id="contract_count_${this.id}" class="contract_count fa-layers-counter fa-4x">CLAIM ${this.contractsOwned}</span>`);
                    this.html.getElementsByClassName(`contract_count`)[0].addEventListener('click', (evt) => {
                        claim(this.id);
                        evt.stopImmediatePropagation();
                        console.log(`Claiming ${this.contractsOwned} contracts...`)
                    })
                } else {
                    this.html.insertAdjacentHTML('afterbegin', `<span class="contract_count fa-layers-counter fa-3x">${this.contractsOwned}</span>`)
                }
            }
        } else {
            this.html.insertAdjacentHTML('beforeend', `<div class="coming_soon alert">coming soon</div>`);
        }
    }

    async asyncInit() {
        await fetch(this.image, { method: 'HEAD' })
            .then((res) => {
                if (!res.ok) {
                    this.image = `/images/product/id_0.png`;
                };
            })
            .catch((err) => { console.info(err) });
        this.genHtml();
        //        console.log(this.html)
    }

    setActiveState() {
        var now = new Date().getTime();
        this.activeStatus = (this.begin < now && now < this.end) ? 1 :
            (this.begin > now) ? 0 : 2;
    }

    async checkForOwnedContracts() {
        this.contractsOwned = Number(await MEHVote.methods.deposits(params.account, web3.utils.padLeft(web3.utils.numberToHex(this.id), 40)).call());
    }

    updateContracts({ _deposited = null, _owned = null }) {
        if (_deposited) {
            this.contractsDeposited = _deposited
            this.remainingContracts = this.mehContracts - this.contractsDeposited;
            this.soldOut = (this.remainingContracts == 0);
        };
        if (_owned) {
            this.contractsOwned = _owned;
        }
    }

    markPurchased() {
        this.saleStatus = 'sold';
        this.html.querySelector(`#buy_nft_${this.id}`).remove();
        this.html.insertAdjacentHTML('afterbegin', `<span id="buy_nft_${this.id}" class="buy_nft meh_buttonsold">PURCHASED</span>`);
    }
};

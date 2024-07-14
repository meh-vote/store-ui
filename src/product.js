import { shortenNumber, showErrors, checkUSDCBalance } from './common.js';
import { params } from './main.js';
import { web3, MEHVote } from './addr.js';
import { getConnectionReady } from './wallet.js';
import { approveUSDC, purchaseProductNFT } from './store.js';

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
        order_min = null
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
        // Need to hold on displaying the remaining contracts until we have a read connection and check the live data
        //        console.log(`contractsDeposited ${this.contractsDeposited}`)
    };

    genHtml() {
        this.html = document.createElement('div');
        this.html.className = 'product';
        this.html.style.backgroundImage = `url(${this.image})`;
        this.html.id = `product_${this.id}`;
        /*        if (params.provider) {
                    this.html.insertAdjacentHTML('afterbegin', `<div class="remaining">${this.remainingContracts ?? '?'}/${this.mehContracts}</div>`);
                };
        *//*        this.html.insertAdjacentHTML('beforeend',
                `<div class="desc">
                    <div class="title">
                        <div>${this.name}</div>
                    </div>
                    <div class="action">
                        <div>${shortenNumber(this.contractPrice,0)} USDC</div>
                        ${(params.provider)
                            ?`<div>Preorder sales</div>`
                            :`<div>Provider required to check preorder status</div>`
                        }
                    </div>
                </div>`);
        */
        /*        if (this.soldOut) {
                    this.html.insertAdjacentHTML('beforeend', `<div class="alert">Sold Out</div>`);
                } else if (this.activeStatus == 0) {
                    this.html.insertAdjacentHTML('beforeend', `<div class="message"><div class="success small_text">Opens<br />${new Date(this.begin).toLocaleString()}</div></div>`);
                } else if (this.activeStatus == 2) {
                    this.html.insertAdjacentHTML('beforeend', `<div class="alert small_text">Voting Closed</div>`);
                } else if (this.activeStatus == 1 && this.soldOut == false) {
                    this.html.addEventListener('click', () => vote(this.id))
                }
        */

        // FOR STYLING, SHOW AS PRESALE STATE
        if (this.saleStatus == 'active') {
            this.html.insertAdjacentHTML('beforeend', `<div class="base_info"><div>${this.name}</div><div>${this.usdcPrice} USDC</div><div>Presale remaining ???/${this.preorderMin}</div></div>`);

            this.html.insertAdjacentHTML('afterbegin', `<span id="buy_nft_${this.id}" class="buy_nft">BUY NFT</span>`);
            this.html.getElementsByClassName(`buy_nft`)[0].addEventListener('click', async (evt) => {
                //buyNFT(this.id);
                evt.stopImmediatePropagation();
                await getConnectionReady()
                    .then(async () => {
//                    console.log(`Connection ready`);
                        //is there enough USDC?
                        let usdcBalance = await checkUSDCBalance(params.account);
                        if (this.usdcPrice > usdcBalance) {
                            showErrors('Not enough USDC');
                            throw new Error('Not enough USDC');
                        } else {
                            console.log(`USDC balance: ${usdcBalance}`);
                        };
                        //get approval?
                        await approveUSDC(this.usdcPrice).catch((e) => {
                            throw new Error(e.message);
                        });
                        //buy NFT
                        await purchaseProductNFT(this.storeId).catch((e) => {
                            throw new Error(e.message);
                        });
                    }).catch((e) => {
                        console.log('connection issue:', e)
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
};

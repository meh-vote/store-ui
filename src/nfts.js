import { params } from './main.js';
import {
    MEH_STORE_NFT,
} from './addr.js';
import {
    calcGas
    ,cleanBigInt
} from './common.js';
import { getProductImageFromProductId, getPhysicalProduct } from './store.js';

export async function loadMyNFTs() {
    let baseHTML = document.createElement("div");
    baseHTML.id = "my_nfts";
    baseHTML.innerHTML =
        `<div id="breadcrumbs">
            <div id="store_link">&lt;&lt; Store</div>
        </div>
        <h1>Owned MEH NFTs</h1>
        <div id="nft_list"></div>`;
    baseHTML.querySelector("#store_link").addEventListener('click', () => {
        baseHTML.remove();
        params.contentDiv.classList.remove("hidden");
    });
    params.contentDiv.insertAdjacentElement('beforebegin', baseHTML);
    params.contentDiv.classList.add("hidden");

    if (params.connection == 'read' || params.connection == 'write') {
        if (!params.ownedNFTs) {    //check NFT contract on balanceOf
            await MEHStoreNFT.methods.balanceOf(params.account).call().then((_nfts)=>{params.ownedNFTs = cleanBigInt(_nfts)}).catch((e)=>{throw e});
            if (params.ownedNFTs == 0) { throw new Error(`No NFTs owned by ${params.account}`); }
        }
        if (typeof(params.ownedNFTs) == 'number') {   //get NFT token ID(s)
            await getERC721TokensHeld().then(tokens => {
                params.ownedNFTs = tokens;
            });    
        }
        const nftList = baseHTML.querySelector("#nft_list");
        params.ownedNFTs.forEach(async token => {
            const productId = await getProductIDFromNFT(token);
            const productImage = await getProductImageFromProductId(productId);
            nftList.insertAdjacentHTML('beforeend', `<div class="nft_token" id="nft_${token}" style="background-image: url(${productImage})">NFT ${token}</div>`);
            document.querySelector(`#nft_${token}`).addEventListener('click', () => {getPhysicalProduct(token,productId)});
        });
    }
}

async function getERC721TokenTransfers() {
    const etherscanApiKey = 'CVCXCX6C1I5AAE4RETWE79G63FU8G8VR39';
    const etherscanUrl = `https://api-sepolia.basescan.org/api?module=account&action=tokennfttx&address=${params.account}&startblock=0&endblock=99999999&sort=asc&apikey=${etherscanApiKey}`;
    const response = await fetch(etherscanUrl);
    const data = await response.json();
    return data.result;
}

async function getERC721TokensHeld() {
    const transfers = await getERC721TokenTransfers();
    const tokenOwnership = {};

    transfers.forEach(transfer => {
        const tokenId = transfer.tokenID;
        const toAddress = transfer.to;
        const fromAddress = transfer.from;

        if (toAddress.toLowerCase() === params.account.toLowerCase()) {
            tokenOwnership[tokenId] = true;
        }
        if (fromAddress.toLowerCase() === params.account.toLowerCase()) {
            tokenOwnership[tokenId] = false;
        }
    });

    const tokensHeld = Object.keys(tokenOwnership).filter(tokenId => tokenOwnership[tokenId]);
    return tokensHeld;
}

async function getProductIDFromNFT(_tokenId, _floodDelay = 250) {
        return new Promise(resolve => setTimeout(() => {
            MEHStoreNFT.methods.getNFTDetailsByTokenId(_tokenId).call().then(out => {
                const tmp = cleanBigInt(out.productId);
                resolve(tmp);
            }).catch((e)=>{throw e});
        }, _floodDelay))
}

window.loadMyNFTs = loadMyNFTs;

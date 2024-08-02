import { params } from './main.js';
import {
    MEH_STORE_NFT,
} from './addr.js';
import {
    calcGas
} from './common.js';

export function loadMyNFTs() {
    let baseHTML = document.createElement("div");
    baseHTML.id = "my_nfts";
    baseHTML.innerHTML = `<div id="breadcrumbs"><div id="store_link">&lt;&lt; Store</div></div><div id="nft_list">Display of owned NFTs</div>`;
    baseHTML.querySelector("#store_link").addEventListener('click', () => {
        baseHTML.remove();
        params.contentDiv.classList.remove("hidden");
    });
    params.contentDiv.insertAdjacentElement('beforebegin', baseHTML);
    params.contentDiv.classList.add("hidden");
}

window.loadMyNFTs = loadMyNFTs;

# JS build for Store UI

## Initial overlay, help screen
* Steps explained
* Store a flag to browser that user has seen 1x

## user-states, on load
Prompt no interaction until required for transaction
* no wallet/ethernet-provider available
* ethernet provider available, wallet not conencted
* ethernet provider available, wallet connected, on Base
* ethernet provider available, wallet connected, on chain other than Base
  * maybe let them buy with USDC on ethereum chain?
* ethernet provider available, wallet connected, on Base, with Meh / Meh-NFT in wallet (?)

## job-tasks
* public: view products
* public: view instructions
  * need to understand; purchase NFT, trade NFT (optional), exchange NFT for product
  * pre-order queue
* buy NFT with USDC / Meh
* exchange NFT for product
  * collect shipping; should we eat shipping in any cases? (eg domestic users exchanging their royalty contract, Meh whales, etc)
* select product attributes (eg. shirt size)
* view pre-order status (% to critical mass)
* collect royalties
* exchange royalty contract for product-nft
## future
* leaderboards
  * need to maintain list of ignored wallets/addresses (eg. treasury)
* buy product with USD/CC (future, will require processor)
  * buy NFT, NFT immediately exchanged for product, address collected, (pre-)order queue updated



- Buy the product (with CC/USD, USDC, Product NFT, Royalty NFT)
- Buy an NFT of the product (with USDC, Royalty NFT)
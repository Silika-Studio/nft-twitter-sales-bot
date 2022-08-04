# NFT Twitter Sales Bot
With the rise of no-Discord NFT collections, Twitter is undeniably the centre of NFT communities. As such, a Twitter bot, which logs all NFT sales is a great value-add to any NFT community.

The Silika Studio NFT Twitter Sales Bot is:

- extensible

- as strongly-typed as possible

- consumable via NPM

It currently supports the following marketplaces:

- OpenSea (Wyvern and Seaport)

- LooksRare

- X2Y2

the following currencies:

- ETH

- WETH

- USDC

- DAI

and the following RPC providers:

- Alchemy

- Etherscan

- Infura

# Quick start
For TypeScript veterans/

1. Install the package via NPM
```
yarn add @silikastudio/nft-twitter-sales-bot
```

2. Import and call `watchCollection`
```
import { watchCollection } from '@silikastudio/nft-twitter-sales-bot';

watchCollection(args);
```
*Note: See the JSDoc comments above `watchCollection` in `/src/index.ts` for up-to-date explanations of all the arguments accepted*

3. Sit back and relax :)

# In-depth start

1. [Install NodeJS](https://nodejs.org/en/download/)
    - This is necessary to run JavaScript programs
1. [Install yarn](https://yarnpkg.com/getting-started/install)
    - Skip if you with to use `npm` instead
1. [Create a new TypeScript app](https://code.visualstudio.com/docs/typescript/typescript-tutorial)
1. Install this package in your TypeScript app

```
yarn add @silikastudio/nft-twitter-sales-bot
```
or
```
npm -i @silikastudio/nft-twitter-sales-bot
```

5. Import and call `watchCollection` from our package

```
import { watchCollection } from '@silikastudio/nft-twitter-sales-bot';

watchCollection(args)
```
*Note: See the comments above `watchCollection` in `/src/index.ts` for up-to-date explanations of all the arguments accepted*

*Another note: See `examples/example.ts` for an example of importing the `watchCollection` method and calling it with the required arguments.

## Tweet formatting

If provided with a `TwitterConfig`, the bot will instantiate a Twitter client using the `twitter-api-v2` library.

In addition to the API keys, the `TwitterConfig` accepts two string templates - one for when a single NFT is sold in a transaction, and the other for when there are multiple sales in one transaction.

The templates accept the following keywords, which will be replaced with the transaction data before the tweet is sent:

- `$$NAME$$`: The name of the NFT that was sold. In the case of multiple NFT sales within the one transaction, this will represent the first token sold.

- `$$NUM_SOLD$$`: The number of tokens sold in this transaction

- `$$PRICE$$`: The total price of the sale.

- `$$MARKETPLACE_NAME$$`: The name of the marketplace, eg: OpenSea, LooksRare, or X2Y2.

- `$$MARKETPLACE_LINK$$`: The link to the sold asset.

- `$$TRANSACTION_HASH$$`: The transaction hash for the sale, most likely used as follows: `'transaction link: https://etherscan.io/tx/$$TRANSACTION_HASH$$`'

## Fetching the ABI
Fetching the contract ABI is fairly easy! You need to pass in the ABI when running the bot as the ABI is what lets us know what functions exist on the contract as well as what arguments they take. Here's how to find it:

1. Find the contract on Etherscan
    - eg: https://etherscan.io/token/0xda64C62254E6ffE6783Dd00472559A1744512846
    - If you don't know how to find the contract address, go to any item in the collection on OpenSea and click on the "contract" link under the "Details" section
1. Go to the "Contract" tab
1. Scroll down and copy everything in the "Contract ABI" section
1. Save it to a file in your project with a ".json" extension
1. Import it like so
```
import abi from "./abiFileName.json"
```
    - Note: ensure you set `compilerOptions.resolveJsonModule` to `true` in your tsconfig.json in order for this import to work
1. Pass `JSON.stringify(abi)` to the `watchCollection` method

## Customisability
If you want to just use the collection-watching functionality of the bot, an `onSaleCallback` is accepted.

If provided, whenever a sale occurs we'll call this method with all the sale information, namely:

```
totalPrice, currencyName, tokenId, contractAddress, assetName
```

# RPC providers
When instantiating a new `ethers.Contract`, you need to pass a a "Provider". A "Provider" is essentially a connection to the blockchain, something that allows you to actually call a contract's methods.

We currently support Alchemy, Etherscan, and Infura, and are happy to add more per user requests.

Signing up for an Alchemy API key is free and very easy, and will give you many more requests per month than one bot would need. You can sign up for one [here](https://www.alchemy.com/)

# Twitter API key

In order for this bot to work, you'll need to generate Twitter various API keys, *and* apply for level 2 access. When applying, ensure you give as much detail as possible about your collection, your bot, and the value it providers to your collection and Twitter users.

You can read more [here](https://developer.twitter.com).

After you’ve been granted level 2 access, make sure you set the User Authentication settings in your project to allow for 0Auth read *and* write.

# A brief summary of EVM logs
The EVM has 5 LOG opcodes, which store extra contextual information in transaction receipts. By default, Solidity-defined events result in these LOG opcodes, giving us access to the context of the event.

The two parts of the logs most relevant to this bot are **topics** and **data**

## Topics
An event can log up to 4 topics. A topic is a 32-byte word, which Ethereum uses in conjunction with a [Bloom Filter](https://en.wikipedia.org/wiki/Bloom_filter) in order to efficiently search events for certain conditions.

By default, Solidity adds the event signature (the hash of the event name and all of its arguments) as the first topic and then the first 3 indexed arguments as the 2nd, 3rd, and 4th topics individually.

The standard [ERC-721]([https://eips.ethereum.org/EIPS/eip-721](https://eips.ethereum.org/EIPS/eip-721)) Transfer event looks like `event Transfer(address indexed from, address indexed to, uint256 indexed id)` in Solidity. As such, topics could allow one to quickly search for all Transfer events of a contract of a specific ID.

## Data
Event logs also can store *data*, which is a hex string with no fixed length that stores anything else the event wishes to log. Data is cheaper to store than topics, but, sacrifices searchability. Usually, events store un-indexed arguments as data.

As such, if we wish to extract any information out of the data, we need to decode the hex string.

This is specifically relevant for parsing the various marketplaces' sale events. Each marketplace contract has a different "Sale" event, e.g. "OrderFulfilled" for Seaport, and "EvProfit" for X2Y2.

By looking at the contract we can find the information required to decode the *data* and extract the value of each sale. These decode schemas are stored in `constants.ts`.

# Resources
- [Great article for understanding event logs + topics vs data](https://medium.com/mycrypto/understanding-event-logs-on-the-ethereum-blockchain-f4ae7ba50378)

# License
This package is licensed under the MIT license. The full license is included adjacent to this README in the `LICENSE` file.

Much of the initial code came from https://github.com/dsgriffin/nft-sales-twitter-bot.
You can view their ISC license [here](https://github.com/dsgriffin/nft-sales-twitter-bot/blob/master/license.txt)

# Silika Studio Offerings

For any collection that doesn't wish to host the bot themselves, Silika Studio offers bot hosting as one of our [studio's services]([https://www.silika.studio#services](https://www.silika.studio#services)). For anyone looking for high-quality web3 dev work, we also offer a range of other services and would love to connect!
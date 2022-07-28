# NFT Twitter Sales Bot
With the rise of no-discord NFT collections, Twitter is undeniably the centre of NFT communities.

As such, a Twitter bot which logs all NFT sales is of vital importance to any NFT collection.

Our aims when building this sales bot was to make something extensible, as strongly-typed as possible, and consumable via NPM.

We at Silika Studio decided to open-source our code and publish it as a public NPM package because transparency is one of our primary tenets. Any collection that wishes to run the bot simply has to consume our library and call 1 method, either on a local or remote machine.

For any collection that doesn't wish to host the bot themselves, we offer it as one of our [studio's services](https://www.silika.studio/). For anyone looking for high quality web3 dev work, we also offer a range of other services and would love to connect!

# Getting started

1. Install the package via NPM
```
yarn add @silikastudio/nft-twitter-sales-bot
```

2. Import and call `watchCollection`
```
import { watchCollection } from '@silikastudio/nft-twitter-sales-bot

watchCollection(args)
```

3. Sit back and relax :)

# Twitter API key

In order for this bot to work, you'll need to generate Twitter API keys, *and* apply for Level 2 access.

You can read more [here](https://developer.twitter.com)

# A brief summary of EVM logs
The EVM has 5 LOG opcodes, which store extra contextual information in transaction receipts. By default, Solidity uses these LOG opcodes to store logs for all contract events.

The two parts of the logs most relevant to this bot are **topics** and **data**

## Topics
An event can log up to 4 topics. A topic is a 32 byte word, which Ethereum uses in conjunction with a [Bloom Filter](https://en.wikipedia.org/wiki/Bloom_filter) in order to facilitate efficiently searching events for certain conditions.

By default, Solidity adds the event signature (the hash of the event name and all of its arguments) as the first topic, and then the first 3 indexed arguments as the 2nd, 3rd, and 4th topics individually.

The standard ERC-721 Transfer event looks like `event Transfer(address indexed from, address indexed to, uint256 indexed id)`. As such, topics could allow one to quickly search for all Transfer events of a contract of a specific ID.

## Data
Event logs also can store *data*, which is a hex string with no fixed length that stores anything else the event wishes to log. Data is cheaper to store than topics, but, sacrifices searchability. Usually events store un-indexed arguments as data.

As such, if we wishe to extract any information out of the data, we need to decode the hex string.

This is specifically relevant for parsing the various marketplaces' sale events. Each marketplace contract has a different "Sale" event, eg: "OrderFulfilled" for Seaport, and "EvProfit" for X2Y2.

By looking at the contract we can find the information required to decode the *data* and extract the value of each sale. These decode schemas are stored in `constants.ts`.


# Resources
- [Great article for understanding event logs + topics vs data](https://medium.com/mycrypto/understanding-event-logs-on-the-ethereum-blockchain-f4ae7ba50378)

# License
This package is licensed under the MIT license. The full license is included adjacent to this README in the `LICENSE` file.

Much of the initial code came from https://github.com/dsgriffin/nft-sales-twitter-bot.
You can view their ISC license [here](https://github.com/dsgriffin/nft-sales-twitter-bot/blob/master/license.txt)
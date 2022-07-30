import { CurrencyRecord, MarketType } from './types';

export const currencies: CurrencyRecord = {
    '0x0000000000000000000000000000000000000000': {
        name: 'ETH',
        decimals: 18,
    },
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
        name: 'WETH',
        decimals: 18,
    },
    '0x6b175474e89094c44da98b954eedeac495271d0f': {
        name: 'DAI',
        decimals: 18,
    },
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
        name: 'USDC',
        decimals: 6,
    },
};

/**
 * Manual information for each supported marketplace.
 *
 * Each marketplace has a different log schema, hence the need
 * to store the information here to decode the log.data.
 */
export const markets: MarketType = {
    '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3': {
        name: 'X2Y2',
        prettyName: 'X2Y2',
        marketplaceUrl: 'https://x2y2.io/eth/',
        logDecoder: [
            {
                type: 'bytes32',
                name: 'itemHash',
            },
            {
                type: 'address',
                name: 'currency',
            },
            {
                type: 'address',
                name: 'to',
            },
            {
                type: 'uint256',
                name: 'amount',
            },
        ],
    },
    '0x7f268357a8c2552623316e2562d90e642bb538e5': {
        name: 'OpenSea (Wyvern)',
        prettyName: 'OpenSea',
        marketplaceUrl: 'https://opensea.io/assets/',
        logDecoder: [
            {
                type: 'bytes32',
                name: 'buyHash',
            },
            {
                type: 'bytes32',
                name: 'sellHash',
            },
            {
                type: 'uint256',
                name: 'price',
            },
        ],
    },
    '0x59728544b08ab483533076417fbbb2fd0b17ce3a': {
        name: 'LooksRare',
        prettyName: 'LooksRare',
        marketplaceUrl: 'https://looksrare.org/collections/',
        logDecoder: [
            {
                type: 'bytes32',
                name: 'orderHash',
            },
            {
                type: 'uint256',
                name: 'orderNonce',
            },
            {
                type: 'address',
                name: 'currency',
            },
            {
                type: 'address',
                name: 'collection',
            },
            {
                type: 'uint256',
                name: 'tokenId',
            },
            {
                type: 'uint256',
                name: 'amount',
            },
            {
                type: 'uint256',
                name: 'price',
            },
        ],
    },
    '0x00000000006c3852cbef3e08e8df289169ede581': {
        name: 'OpenSea (Seaport)',
        prettyName: 'OpenSea',
        marketplaceUrl: 'https://opensea.io/assets/',
        logDecoder: [
            {
                type: 'bytes32',
                name: 'orderHash',
            },
            {
                type: 'address',
                name: 'recipient',
            },
            {
                type: 'tuple[]',
                name: 'offer',
                components: [
                    {
                        type: 'uint8',
                        name: 'itemType',
                    },
                    {
                        type: 'address',
                        name: 'token',
                    },
                    {
                        type: 'uint256',
                        name: 'identifier',
                    },
                    {
                        type: 'uint256',
                        name: 'amount',
                    },
                ],
            },
            {
                type: 'tuple[]',
                name: 'consideration',
                components: [
                    {
                        type: 'uint8',
                        name: 'itemType',
                    },
                    {
                        type: 'address',
                        name: 'token',
                    },
                    {
                        type: 'uint256',
                        name: 'identifier',
                    },
                    {
                        type: 'uint256',
                        name: 'amount',
                    },
                    {
                        type: 'address',
                        name: 'recipient',
                    },
                ],
            },
        ],
    },
};

export const transferEventSignature =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const saleEventSignatures = [
    '0xc4109843e0b7d514e4c093114b863f8e7d8d9a458c372cd51bfe526b588006c9', // OrdersMatched (Opensea Wyvern)
    '0xe2c49856b032c255ae7e325d18109bc4e22a2804e2e49a017ec0f59f19cd447b', // EvProfit (X2Y2)
    '0x95fb6205e23ff6bda16a2d1dba56b9ad7c783f67c96fa149785052f47696f2be', // TakerBid (LooksRare)
    '0x68cd251d4d267c6e2034ff0088b990352b97b2002c0476587d0c4da889c11330', // TakerAsk (LooksRare)
    '0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31', // OrderFulfilled (Opensea Seaport)
];

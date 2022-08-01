/*
    Author: Silika Studio
    License: MIT
    Contributors: @0xetash, @shando_eth, @0xtygra

    Shoutout to https://github.com/dsgriffin/nft-sales-twitter-bot, whose
    code provided much of the initial structure of this bot.
    You can view their ISC license here:
    https://github.com/dsgriffin/nft-sales-twitter-bot/blob/master/license.txt
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Will remove above before publishing
import { BigNumber, ethers } from 'ethers';
import { ParamType } from 'ethers/lib/utils';
import { TwitterApi } from 'twitter-api-v2';
import {
    currencies,
    markets,
    saleEventSignatures,
    transferEventSignature
} from './constants';
import { tweet } from './tweet';
import { DecodedOSLogData, TweetConfig } from './types';
import { getSeaportSalePrice, getTokenData } from './utils';

/**
 * A function that will monitor a collection for all NFT sales,
 * tweeting about each successful sale.
 *
 * @param contractAddress Contract address for the collection you wish
 to monitor
 * @param abi Contract ABI, as a string
 * @param provider Which provider you with to use to query the blockchain.
  Currently accept: Alchemy, Etherscan, and Infura.
 * @param apiKey Optional API key for the provider
 * @param twitterConfig Config for the Twitter connection. If undefined,
 the bot won't tweet anything.
 * @param onSaleCallback Optional callback which will be called with
 all the sale data upon every sale.
 */
export const watchCollection = async (
    contractAddress: string,
    abi: string,
    provider: 'alchemy' | 'etherscan' | 'infura',
    apiKey?: string,
    twitterConfig?: TweetConfig,
    onSaleCallback?: (
        price: number,
        currencyName: string,
        id: string,
        contractAddress: string,
        name: string
    ) => void) => {
    let providerInstance: ethers.providers.Provider;
    switch (provider) {
        case 'alchemy':
            providerInstance =
                new ethers.providers.AlchemyProvider('mainnet', apiKey);
            break;
        case 'etherscan':
            providerInstance =
                new ethers.providers.EtherscanProvider('mainnet', apiKey);
            break;
        case 'infura':
            providerInstance =
                new ethers.providers.InfuraProvider('mainnet', apiKey);
            break;
    }
    const twitterClient = twitterConfig && new TwitterApi(twitterConfig);
    const contract =
        new ethers.Contract(contractAddress, abi, providerInstance);

    // Used for a safety check in case we get dupe Transfer events (can happen)
    let lastTransactionHash: string;

    // https://docs.ethers.io/v5/api/contract/contract/#Contract-on
    // First 3 params map to the Transfer event's `address,address,uint256` args
    contract.on('Transfer',
        async (_from: string, _to: string, _id: BigNumber, data: any) => {
            const transactionHash = data.transactionHash.toLowerCase();
            let tokens: string[] = [];
            let totalPrice = 0;

            // duplicate transaction - skip process
            if (transactionHash == lastTransactionHash) {
                return;
            }

            lastTransactionHash = transactionHash;

            /*
        This callback is called whenever there is a Transfer event on
         the token's contract. When called, we don't yet have the
         context of how/why it was called. In order to see if this
         was a sale, we have to get the context of the tx as a whole
         and look at the `to` (to = marketplace, from = buyer/seller).
         In addition, in order to calculate the price paid, we need
         to see the logs of the tx, stored in the tx receipt.
        */
            const receipt = await data.getTransactionReceipt();
            const recipient = receipt.to.toLowerCase();

            // not a marketplace transaction transfer, skip
            if (!(recipient in markets)) {
                return;
            }
            // retrieve market details
            const market = markets[recipient];

            // default to eth, see `constants.ts` for other supported currencies
            let currencyAddress = '0x0000000000000000000000000000000000000000';
            // Look for whether a non-ETH token was used
            receipt.logs.forEach((log: any) => {
                const logAddress = log.address.toLowerCase();
                if (logAddress in currencies) {
                    currencyAddress = logAddress;
                }
            });
            const currency = currencies[currencyAddress];

            // Look for all transferred tokens
            receipt.logs.forEach((log: any) => {
                // First topic for events is the event signature, 4th is the ID
                // Always true for all standard ERC-721 Transfer events.
                // The Transfer event has 3 args, all indexed,
                // so we know `data` is empty
                if (log.data === '0x' &&
                    log.topics[0] === transferEventSignature) {
                    const tokenId =
                        ethers.BigNumber.from(log.topics[3]).toString();
                    tokens.push(tokenId);
                }
            });

            // Calculate price paid
            receipt.logs.forEach((log: any) => {
                const logAddress = log.address.toLowerCase();
                if (
                    logAddress == recipient &&
                    saleEventSignatures.includes(log.topics[0])
                ) {

                    const decodedLogData =
                        ethers.utils.defaultAbiCoder.decode(
                            market.logDecoder as ParamType[]
                            , log.data,
                        ) as unknown as DecodedOSLogData;
                    switch (market.id) {
                        case 'OpenSea (Seaport)':
                            totalPrice +=
                                getSeaportSalePrice(
                                    decodedLogData,
                                    contractAddress,
                                );
                            break;
                        case 'X2Y2':
                            totalPrice += parseFloat(ethers.utils.formatUnits(
                                decodedLogData.amount,
                                currency.decimals,
                            ));
                            break;
                        default:
                            totalPrice += parseFloat(ethers.utils.formatUnits(
                                decodedLogData.price,
                                currency.decimals,
                            ));
                    }
                }
            });

            totalPrice = parseFloat(totalPrice.toFixed(4));
            console.log(`${totalPrice} ${currency.name} on ${market.id}`);

            // remove any dupes
            tokens = tokens.filter((t, i) => tokens.indexOf(t) === i);

            // retrieve metadata for the first (or only) ERC721 asset sold
            const tokenData = await Promise.all(
                tokens.slice(0, 4).map(token =>
                    getTokenData(contract, token),
                ),
            );

            // If a callback was passed in, call it
            if (onSaleCallback)
                onSaleCallback(
                    totalPrice,
                    currency.name,
                    tokens[0],
                    contractAddress,
                    tokenData[0].assetName,
                );

            if (twitterClient) {
                const args = [
                    twitterClient,
                    tokens.length === 1 ?
                        twitterConfig.tweetTemplateSingle :
                        twitterConfig.tweetTemplateMulti,
                    tokenData,
                    `${totalPrice} ${currency.name}`,
                    market.name,
                    transactionHash,
                    tokens.length,
                    contractAddress,
                    !!twitterConfig.includeImage,
                ] as const; // Necessary such that
                // `args` is a tuple when spread to the `tweet` method

                tweet(...args);
            }
        });
};

export * from './types';

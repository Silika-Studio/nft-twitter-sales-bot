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
    transferEventSignature,
} from './constants';
import { createMessage, discordSetup } from './discord';
import { tweet } from './tweet';
import { DecodedOSLogData, DiscordConfig, MarketName, TweetConfig } from './types';
import { getSeaportSalePrice, getTokenData } from './utils';
import fs from 'fs';
import { onTransaction } from './handler';

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
 the bot won't tweet anything. All these keys and secrets can be found
 in the Twitter developer dashboard.
 * @param onSaleCallback Optional callback which will be called with
 all the sale data upon every sale.
 */
export const watchCollection = async (
    contractAddress: string,
    abi: string,
    provider: 'alchemy' | 'etherscan' | 'infura',
    apiKey?: string,
    twitterConfig?: TweetConfig,
    discordConfig?: DiscordConfig,
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
    const discordChannel = discordConfig &&
        await discordSetup(discordConfig.botToken, discordConfig.channelId);
    const contract =
        new ethers.Contract(contractAddress, abi, providerInstance);

    // Used for a safety check in case we get dupe Transfer events (can happen)
    let lastTransactionHash: string;

    // https://docs.ethers.io/v5/api/contract/contract/#Contract-on
    // First 3 params map to the Transfer event's `address,address,uint256` args
    contract.on('Transfer', (_from: string, _to: string, _id: BigNumber, data: any) => {
        const transactionHash = data.transactionHash.toLowerCase();

        // duplicate transaction - skip process
        if (transactionHash == lastTransactionHash) {
            return;
        }

        const onSale = async (
            price: number,
            currencyName: string,
            tokenIds: string[],
            market: MarketName,
        ) => {
            const tokenData = await Promise.all(
                tokenIds.slice(0, 4).map(token =>
                    getTokenData(contract, token),
                ),
            );

            // If a callback was passed in, call it
            if (onSaleCallback)
                onSaleCallback(
                    price,
                    currencyName,
                    tokenIds[0],
                    contractAddress,
                    tokenData[0].assetName,
                );

            if (twitterClient) {
                const args = [
                    twitterClient,
                    tokenIds.length === 1 ?
                        twitterConfig.tweetTemplateSingle :
                        twitterConfig.tweetTemplateMulti,
                    tokenData,
                    `${price} ${currencyName}`,
                    market,
                    transactionHash,
                    tokenIds.length,
                    contractAddress,
                    !!twitterConfig.includeImage,
                ] as const; // Necessary such that
                // `args` is a tuple when spread to the `tweet` method

                tweet(...args);
            }

            if (discordChannel) {
                const message = createMessage(
                    tokenData,
                    price,
                    _to,
                    _from,
                    contractAddress,
                    discordConfig.messageColour
                );
                try {
                    await discordChannel.send({ embeds: [message] });
                } catch (e: any) {
                    console.log('Error sending message', ' ', e.message);
                }
            }
        };

        lastTransactionHash = transactionHash;
        onTransaction(_from, _to, _id, data, onSale);
    });

};

export * from './types';

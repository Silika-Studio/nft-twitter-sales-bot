/* eslint-disable @typescript-eslint/no-unused-vars */
// Will remove above before publishing
import { BigNumber, ethers } from 'ethers';
import { ParamType } from 'ethers/lib/utils';
import Twit, { Options as TwitOptions } from 'twit';
import { currencies, markets, saleEvents, transferEvents } from './constants';
import { DecodedOSLogData } from './types';
import { getSeaportSalePrice } from './utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

export async function monitorContract(contractAddress: string, abi: string, twitterConfig: TwitOptions) {
    const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY);

    const twitterClient = new Twit(twitterConfig);

    // sometimes web3.js can return duplicate transactions in a split second, so
    let lastTransactionHash: string;

    const contract = new ethers.Contract(contractAddress, abi, provider);

    // https://docs.ethers.io/v5/api/contract/contract/#Contract-on
    // First 3 params map to the Transfer event's `address,address,uint256` type
    contract.on('Transfer', async (_from: string, _to: string, _id: BigNumber, data: any) => {
        const transactionHash = data.transactionHash.toLowerCase();

        console.log(data);
        console.log(_from);
        console.log(_to);

        // duplicate transaction - skip process
        if (transactionHash == lastTransactionHash) {
            return;
        }

        lastTransactionHash = transactionHash;

        /*
  This callback is called whenever there is a Transfer event on the token's contract.
  When called, we don't yet have the context of how/why it was called. In order to see
  if this was a sale, we have to get the context of the tx has a whole and look at the
  `to` (to = marketplace, from = buyer/seller). In addition, in order to calculate the
  price paid, we need to see the logs of the tx. This is why we need the receipt.
*/
        const receipt = await data.getTransactionReceipt();
        const recipient = receipt.to.toLowerCase();

        // not a marketplace transaction transfer, skip
        if (!(Object.keys(markets).includes(recipient))) {
            return;
        }

        // retrieve market details
        const market = markets[recipient];

        let tokens: string[] = [];
        let totalPrice: number | undefined = undefined;
        // default to eth, `constants.ts` for other supported currencies
        let currency = {
            name: 'ETH',
            decimals: 18,
            threshold: 1,
        };

        for (const log of receipt.logs) {
            const logAddress = log.address.toLowerCase();

            // if paid for by non ETH token
            if (logAddress in currencies) {
                currency = currencies[logAddress];
            } else if (log.data == '0x' && transferEvents.includes(log.topics[0])) {
                // As all parts of the Transfer event are topics, data will be empty ("0x")
                const tokenId = ethers.BigNumber.from(log.topics[3]).toString();
                tokens.push(tokenId);
            } else if (logAddress == recipient && saleEvents.includes(log.topics[0])) {
                // transaction log as the event signature is one of our known sale events
                /*
                * ethers' `ParamType` type is really bad, hence the need to cast to `ParamType[]`.
                * In essence, it has multiple mandatory attributes that are in fact optional
                * (they even call them out as nullable in the comments above the attribute)
                * Our decode type is a `Pick` of their `ParamType` with proper optional-ability
                */
                const decodedLogData = ethers.utils.defaultAbiCoder.decode(market.logDecoder as ParamType[], log.data);

                if (market.name == 'Opensea ⚓️') {
                    totalPrice = getSeaportSalePrice(decodedLogData as unknown as DecodedOSLogData, contractAddress);
                } else if (market.name == 'X2Y2 ⭕️') {
                    totalPrice = parseFloat(ethers.utils.formatUnits(
                        decodedLogData.amount,
                        currency.decimals,
                    ));
                } else {
                    totalPrice = parseFloat(ethers.utils.formatUnits(
                        decodedLogData.price,
                        currency.decimals,
                    ));
                }
            }
        }
        if (!totalPrice) {
            console.log('no price');
            return;
        }

        console.log(market.name);
        console.log(`${totalPrice} ${currency.name}`);

        // remove any dupes
        tokens = tokens.filter((t, i) => tokens.indexOf(t) === i);

        // retrieve metadata for the first (or only) ERC721 asset sold
        // const tokenData = await getTokenData(tokens[0]);
        // if more than one asset sold, link directly to etherscan tx, otherwise the marketplace item
        // if (tokens.length > 1) {
        //   tweet(
        //     twitterClient,
        //     `& other assets bought for ${totalPrice} ${currency.name} on ${market.name
        //     } https://etherscan.io/tx/${transactionHash}`
        //   );
        // } else {
        //   tweet(
        //     twitterClient,
        //     `$ bought for ${totalPrice} ${currency.name} on ${market.name} ${market.site
        //     }${process.env.CONTRACT_ADDRESS}/${tokens[0]}`
        //   );
        // }
    });
}


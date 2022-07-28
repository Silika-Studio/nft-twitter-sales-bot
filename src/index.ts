/* eslint-disable @typescript-eslint/no-unused-vars */
// Will remove above before publishing
import { BigNumber, ethers } from 'ethers';
import { ParamType } from 'ethers/lib/utils';
import Twit, { Options as TwitOptions } from 'twit';
import { currencies, markets, saleEventSignatures, transferEventSignature } from './constants';
import { DecodedOSLogData } from './types';
import { getSeaportSalePrice } from './utils';

/**
 * A function that will monitor a collection for all NFT sales,
 * tweeting about each successful sale.
 *
 * @param contractAddress Contract address for the collection you which to monitor
 * @param abi Contract ABI, as a string
 * @param twitterConfig Config for the Twitter connection via the `twit` package
 * @param rpcString String used to instantiate the RPC provider
 */
export const watchCollection = async (contractAddress: string, abi: string, twitterConfig: TwitOptions, rpcString: string) => {
    const provider = new ethers.providers.JsonRpcProvider(rpcString);
    const twitterClient = new Twit(twitterConfig);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Used for a safety check in case we get dupe Transfer events (can happen)
    let lastTransactionHash: string;

    // https://docs.ethers.io/v5/api/contract/contract/#Contract-on
    // First 3 params map to the Transfer event's `address,address,uint256` type
    contract.on('Transfer', async (_from: string, _to: string, _id: BigNumber, data: any) => {
        const transactionHash = data.transactionHash.toLowerCase();
        let tokens: string[] = [];
        let totalPrice: number | undefined = undefined;

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
        if (!(recipient in markets)) {
            return;
        }
        // retrieve market details
        const market = markets[recipient];

        // default to eth, `constants.ts` for other supported currencies
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
            // First topic for events is the event signature
            if (log.topics[0] === transferEventSignature) {
                const tokenId = ethers.BigNumber.from(log.topics[3]).toString();
                tokens.push(tokenId);
            }
        });

        // Calculate price paid
        receipt.logs.forEach((log: any) => {
            const logAddress = log.address.toLowerCase();
            if (logAddress == recipient && saleEventSignatures.includes(log.topics[0])) {

                const decodedLogData = ethers.utils.defaultAbiCoder.decode(market.logDecoder as ParamType[], log.data) as unknown as DecodedOSLogData;

                switch (market.name) {
                    case 'OpenSea (Seaport)':
                        totalPrice = getSeaportSalePrice(decodedLogData, contractAddress);
                        break;
                    case 'X2Y2':
                        totalPrice = parseFloat(ethers.utils.formatUnits(
                            decodedLogData.amount,
                            currency.decimals,
                        ));
                        break;
                    default:
                        totalPrice = parseFloat(ethers.utils.formatUnits(
                            decodedLogData.price,
                            currency.decimals,
                        ));

                }
            }
        });

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
};


import { BigNumber, ethers } from 'ethers';
import { ParamType } from 'ethers/lib/utils';
import {
    currencies,
    markets,
    saleEventSignatures,
    transferEventSignature,
} from './constants';
import { DecodedOSLogData, MarketName } from './types';
import { getSeaportSalePrice } from './utils';

export const onTransaction = async (_from: string, _to: string, _id: BigNumber, data: any, onSale: (
    price: number,
    currencyName: string,
    tokenIds: string[],
    market: MarketName
) => void
) => {
    const contractAddress = data.address;
    let tokenIds: string[] = [];
    let totalPrice = 0;

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
            tokenIds.push(tokenId);
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
    tokenIds = tokenIds.filter((t, i) => tokenIds.indexOf(t) === i);

    onSale(totalPrice, currency.name, tokenIds, market.name);

};

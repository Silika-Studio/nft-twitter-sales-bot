import { ParamType } from 'ethers/lib/utils';

// ------------ OS log types ------------
export type OfferAndConsiderationBase = [string, string, string, string, string] & {
    itemType: string;
    token: string;
    identifier: string;
    amount: string;
};

export type IndividualOffer = OfferAndConsiderationBase;
/**
 * Decoded log type for the buyer of the NFT
 */
export type Offer = IndividualOffer[];

export type IndividualConsideration = [...OfferAndConsiderationBase,
] & { recipient: string; };
/**
 * Decoded log type for the seller of the NFT
 */
export type Consideration = IndividualConsideration[];

/**
 * If the buyer is the one who executes the final tx (aka pressing "Buy Now")
 * then the consideration log data will contain the token info, and the offer
 * the price paid.
 *
 * If accepting an offer, it's reversed
 */
export type DecodedOSLogData = {
    [key: string]: string;
} & { consideration: Consideration; offer: Offer; };

// ------------ end ------------

export type Currency = { [k in string]:
    {
        name: string,
        decimals: number,
        threshold: number,
    }
};

type BaseDecodeParamType = Pick<ParamType, 'type' | 'name'>;
type DecodeParamType = BaseDecodeParamType & { components?: BaseDecodeParamType[]; };

export type MarketType = { [k in string]: { name: string, site: string, logDecoder: DecodeParamType[]; } };

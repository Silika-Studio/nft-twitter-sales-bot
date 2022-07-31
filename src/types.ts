import { ParamType } from 'ethers/lib/utils';
import { TwitterApiTokens } from 'twitter-api-v2';

// ------------ OS log types ------------
/**
 * Base decoded log data for both Offers and Considerations.
 *
 * For more information on this type, look at the non-indexed args
 * of Seaport's `OrderFulfilled` event, as those are what is included
 * as data
 * @link https://etherscan.io/address/0x00000000006c3852cbef3e08e8df289169ede581#code
 */
export type OfferAndConsiderationBase =
    [string, string, string, string, string] & {
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
export type DecodedOSLogData =
    Record<string, string> & { consideration: Consideration; offer: Offer; };

// ------------ end ------------

export interface Currency {
    /**
     * Currency name, eg "ETH"
     */
    name: string;
    /**
     * Number of decimals for this currency
     */
    decimals: number;
}

export type Currencies = Record<string, Currency>;

/**
 * ethers' `ParamType` type is quite bad.
 * In essence, it has multiple mandatory attributes that are in fact optional
 * (they even call them out as nullable in the comments above the attribute)
 * Our decode type is a `Pick` of their `ParamType` with proper optional-ability
 */
type BaseDecodeParamType = Pick<ParamType, 'type' | 'name'>;
type DecodeParamType =
    BaseDecodeParamType & { components?: BaseDecodeParamType[]; };

/**
 * Human-readable name for supported marketplace contracts
 */
type MarketName =
    'OpenSea (Wyvern)' |
    'OpenSea (Seaport)' |
    'X2Y2' |
    'LooksRare';

export interface Market {
    /**
     * ID of the market
     */
    name: MarketName;
    /**
     * String used when tweeting
     * eg: Seaport and Wyvern have different "name"s,
     * but we tweet "OpenSea" for both
     */
    prettyName: string;
    /**
     * URL to marketplace
     */
    marketplaceUrl: string;
    /**
     * Known schema used to decode this marketplace's logs
     */
    logDecoder: DecodeParamType[];
}
export type Markets = Record<string, Market>;

/**
 * All the information required to have the bot tweet for you.
 */
export interface TweetConfig extends TwitterApiTokens {
    /**
     * String format for a single NFT sale
     */
    tweetTemplateSingle: string;
    /**
     * String format for multiple NFT sales within the one tx
     */
    tweetTemplateMulti: string;

    /**
     * Whether to include the image of the first NFT in the tweet
     */
    includeImage?: boolean;
}

export interface TokenData {
    assetName: string;
    imageUrl: string;
}

export interface TokenUriResponse {
    name: string;
    image: string;
    image_url: string;
}

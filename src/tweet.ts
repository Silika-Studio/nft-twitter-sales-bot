
import { SendTweetV2Params, TwitterApi } from 'twitter-api-v2';
import { MarketName, TokenDataWithImageBuffer } from './types';

/**
 * Get the specific marketplace link to the sold asset
 */
const getMarketplaceLink = (
    marketName: MarketName,
    tokenId: string,
    contractAddress: string,
) => {
    let url = '';
    switch (marketName) {
        case 'OpenSea':
            // eslint-disable-next-line max-len
            url = `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`;
            break;
        case 'LooksRare':
            url =
                // eslint-disable-next-line max-len
                `https://looksrare.org/collections/${contractAddress}/${tokenId}`;
            break;
        case 'X2Y2':
            url =
                // eslint-disable-next-line max-len
                `https://x2y2.io/eth/${contractAddress}/${tokenId}`;
            break;
    }
    return url;

};
/**
 * Takes a template string and replaces the template variables with the
 correct data
 */
const fillTweetTemplate = (
    tweetTemplate: string,
    assetName: string,
    price: string,
    marketName: MarketName,
    txHash: string,
    numSold: number,
    id: string,
    contractAddress: string,
) =>
    tweetTemplate.replace('$$NAME$$', assetName)
        .replace('$$PRICE$$', price)
        .replace('$$MARKETPLACE_NAME$$', marketName)
        .replace('$$MARKETPLACE_LINK$$',
            getMarketplaceLink(marketName, id, contractAddress))
        .replace('$$TRANSACTION_HASH$$', txHash)
        .replace('$$NUM_SOLD$$', numSold.toString());

/**
 * Composes and sends a tweet, with the option to upload images.
 * @param twitterClient Initialised Twitter client that handles
 the image uploading / tweet sending
 * @param tweetTemplate Template string for the tweet. See
 README for supported template variables
 * @param tokenData Array of data for up to 4 tokens sold
 * @param price Price of the asset, eg: "0.042 ETH"
 * @param marketplaceName Name of the marketplace
 * @param txHash Transaction hash
 * @param numSold Number of NFTs sold in this transaction
 * @param showImages whether to upload token images
 * to Twitter and then attach it in the tweet.
 */
export const tweet = async (
    twitterClient: TwitterApi,
    tweetTemplate: string,
    tokenData: TokenDataWithImageBuffer[],
    price: string,
    marketplaceName: MarketName,
    txHash: string,
    numSold: number,
    contractAddress: string,
    showImages: boolean,
) => {
    const mediaIds: { id: string, name: string; }[] = [];
    // If an image URL is provided, GET the image, upload it to Twitter, and
    // save the resultant ID to be used when sending the tweet
    if (showImages) {
        await Promise.all(tokenData.map(async (token) => {
            const { imageUrl } = token;
            if (!imageUrl) return;
            try {
                // Retrieve the image, resize and convert to webp.
                // Twitter has a 5.2 mb byte limit to uploaded images
                mediaIds.push({
                    id: await twitterClient.v1.uploadMedia(
                        token.buffer,
                        { mimeType: 'webp' },
                    ),
                    name: token.assetName,
                });
            } catch (e) {
                console.log(`❌ Failed to upload ${imageUrl} to Twitter.`);
                console.log(e);
            }
        }));
    }
    const options: Partial<SendTweetV2Params> =
        mediaIds.length ?
            { media: { media_ids: mediaIds.map(mId => mId.id) } } :
            {};

    // Add alt text to the uploaded image
    if (mediaIds.length)
        await Promise.all(mediaIds.map(mId => {
            try {
                return twitterClient.v1.createMediaMetadata(
                    mId.id,
                    { alt_text: { text: mId.name } },
                );
            } catch (e) {
                console.log(`❌ Failed to add metadata for image ${mId}.`);
                console.log(e);
            }
        }));

    try {
        const res = await twitterClient.v2.tweet(fillTweetTemplate(
            tweetTemplate,
            tokenData[0].assetName,
            price,
            marketplaceName,
            txHash,
            numSold,
            tokenData[0].id,
            contractAddress,
        ), options);
        console.log('✅ Successfully sent the following tweet:');
        console.log(res);
    } catch (e: any) {
        console.log(e);
    }
};


import axios from 'axios';
import sharp from 'sharp';
import { SendTweetV2Params, TwitterApi } from 'twitter-api-v2';
import { TokenData } from './types';

/**
 * Takes a template string and replaces the template variables with the correct data
 */
const fillTweetTemplate = (tweetTemplate: string, assetName: string, price: string, marketplaceName: string, txHash: string, numSold: number) =>
    tweetTemplate.replace('$$NAME$$', assetName)
        .replace('$$PRICE$$', price)
        .replace('$$MARKETPLACE_NAME$$', marketplaceName)
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
    tokenData: TokenData[],
    price: string,
    marketplaceName: string,
    txHash: string,
    numSold: number,
    showImages: boolean,
) => {
    const mediaIds: { id: string, name: string; }[] = [];
    // If an image URL is provided, GET the image, upload it to Twitter, and
    // save the resultant ID to be used when sending the tweet
    if (showImages) {
        await Promise.all(tokenData.map(async (token) => {
            const { imageUrl } = token;
            try {
                // Retrieve the image, resize and convert to webp.
                // Twitter has a 5.2 mb byte limit to uploaded images
                const buffer = Buffer.from(await sharp((await axios.get(
                    imageUrl,
                    { responseType: 'arraybuffer' },
                )).data).resize({
                    width: 1200,
                })
                    .webp()
                    .toBuffer());
                mediaIds.push({
                    id: await twitterClient.v1.uploadMedia(
                        buffer,
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
            numSold), options);
        console.log('✅ Successfully sent the following tweet:');
        console.log(res);
    } catch (e: any) {
        console.log(e);
    }
};


import axios from 'axios';
import sharp from 'sharp';
import { SendTweetV2Params, TwitterApi } from 'twitter-api-v2';

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
 * Composes and sends a tweet. If an imageUrl is
 * @param twitterClient Initialised Twitter client that handles the image uploading / tweet sending
 * @param tweetTemplate Template string for the tweet. See README for supported template variables
 * @param assetName Name of the asset, eg: "Silika Collectible #1"
 * @param price Price of the asset, eg: "0.042 ETH"
 * @param marketplaceName Name of the marketplace
 * @param txHash Transaction hash
 * @param numSold Number of NFTs sold in this transaction
 * @param imageUrl Optional imageUrl. If provided provided, it will upload that image
 * to Twitter and then attach it in the tweet.
 */
export const tweet = async (twitterClient: TwitterApi, tweetTemplate: string, assetName: string, price: string, marketplaceName: string, txHash: string, numSold: number, imageUrl?: string) => {
    let mediaId = '';
    // If an image URL is provided, GET the image, upload it to Twitter, and
    // save the resultant ID to be used when sending the tweet
    if (imageUrl) {
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
            mediaId = await twitterClient.v1.uploadMedia(buffer, { mimeType: 'webp' });
        } catch (e) {
            console.log(`❌ Failed to upload ${imageUrl} to Twitter.`);
            console.log(e);
        }
    }
    const options: Partial<SendTweetV2Params> = mediaId ? { media: { media_ids: [mediaId] } } : {};

    // Add alt text to the uploaded image
    if (mediaId)
        try {
            twitterClient.v1.createMediaMetadata(mediaId, { alt_text: { text: assetName } });
        } catch (e) {
            console.log(`❌ Failed to add metadata for image id ${mediaId}.`);
            console.log(e);
        }

    try {
        const res = await twitterClient.v2.tweet(fillTweetTemplate(tweetTemplate, assetName, price, marketplaceName, txHash, numSold), options);
        console.log('✅ Successfully sent the following tweet:');
        console.log(res);
    } catch (e: any) {
        console.log(e);
    }
};

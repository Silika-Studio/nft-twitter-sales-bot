import twit from 'twit';

// Tweet a text-based status
export const tweet = async (twitterClient: twit, tweetText: string) => {
    const tweetData = {
        status: tweetText,
    };

    twitterClient.post('statuses/update', tweetData, (error) => {
        if (!error) {
            console.log(`Successfully tweeted: ${tweetText}`);
        } else {
            console.error(error);
        }
    });
};

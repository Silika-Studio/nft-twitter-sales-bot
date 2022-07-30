import { watchCollection } from '../src/index';
import { TweetConfig } from '../src/types';
import abi from './abi.json';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const twitterConfig: TweetConfig = {
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_KEY_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    tweetTemplateSingle: '$$NAME$$ bought for $$PRICE$$ on $$MARKETPLACE_NAME$$ - https://etherscan.io/tx/$$TRANSACTION_HASH$$',
    tweetTemplateMulti: '$$NUM_SOLD$$ Good Minds bought for $$PRICE$$ on $$MARKETPLACE_NAME$$ - https://etherscan.io/tx/$$TRANSACTION_HASH$$',
    includeImage: true,
};

watchCollection('0x1a92f7381b9f03921564a437210bb9396471050c', JSON.stringify(abi), 'https://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    twitterConfig,
);

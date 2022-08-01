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
    tweetTemplateSingle: '$$NAME$$ bought for $$PRICE$$ on $$MARKETPLACE_NAME$$:\n$$MARKETPLACE_LINK$$\nhttps://etherscan.io/tx/$$TRANSACTION_HASH$$',
    tweetTemplateMulti: '$$NUM_SOLD$$ Good Minds bought for $$PRICE$$ on $$MARKETPLACE_NAME$$ - https://etherscan.io/tx/$$TRANSACTION_HASH$$',
    includeImage: true,
};

watchCollection(
    '0x2a459947f0ac25ec28c197f09c2d88058a83f3bb',
    JSON.stringify(abi),
    'alchemy',
    process.env.ALCHEMY_API_KEY!,
    twitterConfig,
);

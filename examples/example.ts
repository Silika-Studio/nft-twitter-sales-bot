import { config } from "dotenv";
import { watchCollection } from '../src/index';
import { DiscordConfig, TweetConfig } from '../src/types';
import abi from './abi.json';

config();

const twitterConfig: TweetConfig = {
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_KEY_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    tweetTemplateSingle: '$$NAME$$ bought for $$PRICE$$ on $$MARKETPLACE_NAME$$:\n$$MARKETPLACE_LINK$$\nhttps://etherscan.io/tx/$$TRANSACTION_HASH$$',
    tweetTemplateMulti: '$$NUM_SOLD$$ Good Minds bought for $$PRICE$$ on $$MARKETPLACE_NAME$$ - https://etherscan.io/tx/$$TRANSACTION_HASH$$',
    includeImage: true,
};

const discordConfig: DiscordConfig = {
    botToken: process.env.DISCORD_BOT_KEY!,
    channelId: process.env.DISCORD_CHANNEL_ID!,
    messageColour: '#A8DFFF'
}

watchCollection(
    '0x05072a7137d11e281cef6f58e00dba69d66616da',
    JSON.stringify(abi),
    'alchemy',
    process.env.ALCHEMY_API_KEY!,
    twitterConfig,
    discordConfig
);

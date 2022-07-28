import { watchCollection } from '../src/index';
import abi from './abi.json';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

watchCollection('0x2a459947f0ac25ec28c197f09c2d88058a83f3bb', JSON.stringify(abi), {
    consumer_key: process.env.TWITTER_API_KEY!,
    consumer_secret: process.env.TWITTER_API_KEY_SECRET!,
    access_token: process.env.TWITTER_ACCESS_TOKEN!,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
}, 'https://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY);

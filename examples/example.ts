import { monitorContract } from '../src/index';
import abi from './abi.json';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

monitorContract('0xf5b969064b91869fbf676ecabccd1c5563f591d0', JSON.stringify(abi), {
    consumer_key: process.env.TWITTER_API_KEY!,
    consumer_secret: process.env.TWITTER_API_KEY_SECRET!,
    access_token: process.env.TWITTER_ACCESS_TOKEN!,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

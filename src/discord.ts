import Discord, { HexColorString, Intents, TextChannel } from 'discord.js';
import { TokenDataWithImageBuffer } from './types';

/**
 * https://github.com/0xdeployer/discord-nft-sales-bot/blob/main/src/discord.ts
 * @param botToken 
 * @param channelId 
 * @returns a Promise<TextChanel> representing the channel the bot will post in
 */
export const discordSetup = (
    botToken: string,
    channelId: string
): Promise<TextChannel> => {
    const discordBot = new Discord.Client({
        intents: [Intents.FLAGS.GUILD_MESSAGES],
    });
    return new Promise<TextChannel>((resolve) => {
        discordBot.login(botToken);
        discordBot.on('ready', async () => {
            const channel = await discordBot.channels.fetch(channelId);
            resolve(channel as TextChannel);
        });
    });
};

export const createMessage = (
    tokenData: TokenDataWithImageBuffer[],
    value: number,
    buyer: string,
    seller: string,
    contractAddress: string,
    messageColour: HexColorString
) =>
    new Discord.MessageEmbed()
        .setColor(messageColour)
        .setTitle(`${tokenData[0].assetName}${tokenData.length > 1 ? ` and ${tokenData.length - 1} others` : ''} sold!`)
        .addFields(
            { name: 'Name', value: tokenData[0].assetName },
            { name: 'Amount', value: `${value} Ξ` },
            { name: 'Buyer', value: buyer },
            { name: 'Seller', value: seller },
        )
        .setURL(`https://opensea.io/assets/${contractAddress}/${tokenData[0].id}`)
        .setImage(tokenData[0].imageUrl);

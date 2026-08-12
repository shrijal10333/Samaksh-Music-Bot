const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const emoji = require("../../emojis");

module.exports = {
    name: "firstmsg",
    category: "Utility",
    description: "Get the first message sent in the channel",
    aliases: ["fm", "firstmessage"],
    args: false,
    usage: "firstmsg [channel]",
    permission: [],
    slashOptions: [
        {
            name: 'channel',
            description: 'The channel to get the first message from',
            type: 7,
            required: false
        }
    ],

    async slashExecute(interaction, client) {
        return module.exports.run(interaction, client, true);
    },

    async execute(message, args, client) {
        return module.exports.run(message, client, false, args);
    },

    async run(context, client, isSlash, args = []) {
        const guild = context.guild;
        const author = isSlash ? context.user : context.author;

        let targetChannel;
        if (isSlash) {
            targetChannel = context.options.getChannel("channel") || context.channel;
        } else {
            targetChannel = context.mentions.channels.first() || (args[0] ? guild.channels.cache.get(args[0]) : context.channel);
        }

        if (!targetChannel || !targetChannel.isTextBased()) {
            const errorDisplay = new TextDisplayBuilder().setContent(`${emoji.cross} **Please provide a valid text channel.**`);
            const container = new ContainerBuilder().addTextDisplayComponents(errorDisplay);
            const options = { components: [container], flags: MessageFlags.IsComponentsV2 };
            return isSlash ? context.reply(options) : context.reply(options);
        }

        if (isSlash && !context.deferred) await context.deferReply();

        try {
            const messages = await targetChannel.messages.fetch({ after: '0', limit: 1 });
            const firstMsg = messages.first();

            if (!firstMsg) {
                const noMsg = new TextDisplayBuilder().setContent(`${emoji.info} **No messages found in this channel.**`);
                const container = new ContainerBuilder().addTextDisplayComponents(noMsg);
                const options = { components: [container], flags: MessageFlags.IsComponentsV2 };
                return isSlash ? context.editReply(options) : context.reply(options);
            }

            const createdAt = Math.floor(firstMsg.createdTimestamp / 1000);
            const content = firstMsg.content ? (firstMsg.content.length > 500 ? firstMsg.content.substring(0, 500) + "..." : firstMsg.content) : "*None (Possibly an embed or attachment)*";

            const container = new ContainerBuilder();
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### First Message in <#${targetChannel.id}>`));
            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `${emoji.hastag} **__Message Details__**\n` +
                `> **Sent by :** [\`${firstMsg.author.displayName}\`](https://discord.user/${firstMsg.author.id}) ( ${firstMsg.author.id} )\n` +
                `> **Sent at :** <t:${createdAt}:F> ( <t:${createdAt}:R> )\n\n` +
                `${emoji.hastag} **__Content__**\n` +
                `> ${content}`
            ));

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Jump to Message')
                    .setStyle(ButtonStyle.Link)
                    .setURL(firstMsg.url)
            );

            const options = { components: [container, row], flags: MessageFlags.IsComponentsV2 };
            return isSlash ? context.editReply(options) : context.reply(options);

        } catch (error) {
            console.error("Error in firstmsg command:", error);
            const errorDisplay = new TextDisplayBuilder().setContent(`${emoji.warn} **An error occurred while fetching the first message.**`);
            const container = new ContainerBuilder().addTextDisplayComponents(errorDisplay);
            if (isSlash) return context.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            else return context.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }
    }
};

const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ChannelType,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    PermissionFlagsBits
} = require("discord.js");
const emoji = require("../../emojis");

module.exports = {
    name: "channelinfo",
    category: "Utility",
    description: "Get detailed information about a channel",
    aliases: ["ci", "channel"],
    args: false,
    usage: "channelinfo [channel]",
    permission: [],
    slashOptions: [
        {
            name: 'channel',
            description: 'The channel to get information about',
            type: 7,
            required: false
        }
    ],

    async slashExecute(interaction, client) {
        return module.exports.runInfo(interaction, client, true);
    },

    async execute(message, args, client) {
        return module.exports.runInfo(message, client, false, args);
    },

    async runInfo(context, client, isSlash, args = []) {
        const guild = context.guild;
        const author = isSlash ? context.user : context.author;

        if (isSlash && !context.deferred) await context.deferReply();

        let channel;
        if (isSlash) {
            channel = context.options.getChannel("channel") || context.channel;
        } else {
            channel = context.mentions.channels.first() ||
                guild.channels.cache.get(args[0]) ||
                guild.channels.cache.find(c => c.name.toLowerCase() === args.slice(0).join(" ").toLowerCase()) ||
                context.channel;
        }

        if (!channel) {
            const errorDisplay = new TextDisplayBuilder().setContent(`${emoji.cross} **Could not find that channel.**`);
            const container = new ContainerBuilder().addTextDisplayComponents(errorDisplay);
            const options = { components: [container], flags: MessageFlags.IsComponentsV2 };
            return isSlash ? context.editReply(options) : context.reply(options);
        }

        try {
            const createdAt = Math.floor(channel.createdTimestamp / 1000);
            const channelTypes = {
                0: "Text Channel",
                1: "DM",
                2: "Voice Channel",
                3: "Group DM",
                4: "Category",
                5: "Announcement Channel",
                10: "Announcement Thread",
                11: "Public Thread",
                12: "Private Thread",
                13: "Stage Channel",
                14: "Directory",
                15: "Forum Channel",
                16: "Media Channel"
            };

            const container = new ContainerBuilder();
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### <#${channel.id}>'s Info\n-# Requested by ${author.username} • <t:${Math.floor(Date.now() / 1000)}:t>`));
            container.addSeparatorComponents(new SeparatorBuilder());


            let generalContent =
                `${emoji.hastag} **__General__**\n` +
                `> **Name :** ${channel.name}\n` +
                `> **ID :** ${channel.id}\n` +
                `> **Mention :** <#${channel.id}>\n` +
                `> **Type :** ${channelTypes[channel.type] || "Unknown"}\n` +
                `> **Category :** ${channel.parent ? channel.parent.name : "None"}\n` +
                `> **Created :** <t:${createdAt}:R>\n` +
                `> **Position :** ${channel.position}`;

            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(generalContent));

            let settingsContent =
                `${emoji.hastag} **__Settings__**\n` +
                `> **NSFW :** ${channel.nsfw ? "Yes" : "No"}`;

            if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
                settingsContent += `\n> **Topic :** ${channel.topic || "None"}`;
                settingsContent += `\n> **Slowmode :** ${channel.rateLimitPerUser ? `${channel.rateLimitPerUser}s` : "None"}`;
            }

            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(settingsContent));

            if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
                let voiceContent =
                    `${emoji.hastag} **__Voice Settings__**\n` +
                    `> **Bitrate :** ${channel.bitrate / 1000}kbps\n` +
                    `> **User Limit :** ${channel.userLimit === 0 ? "Unlimited" : channel.userLimit}\n` +
                    `> **Region :** ${channel.rtcRegion || "Auto"}\n` +
                    `> **Connected :** ${channel.members.size} Users`;

                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(voiceContent));
            }

            const options = {
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] }
            };

            if (isSlash) return context.editReply(options);
            else return context.reply(options);

        } catch (error) {
            console.error("Error in channelinfo command:", error);
            const errorDisplay = new TextDisplayBuilder().setContent(`${emoji.warn} An error occurred while fetching channel information.`);
            const container = new ContainerBuilder().addTextDisplayComponents(errorDisplay);
            const errOptions = { components: [container], flags: MessageFlags.IsComponentsV2 };
            if (isSlash) return context.editReply(errOptions);
            else return context.reply(errOptions);
        }
    }
};

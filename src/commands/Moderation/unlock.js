const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');
const emoji = require('../../emojis');

module.exports = {
    name: 'unlock',
    description: 'Unlocks the specified channel',
    category: 'Moderation',
    usage: 'unlock [channel]',
    example: 'unlock #general',
    slashOptions: [
        {
            name: 'channel',
            description: 'The channel to unlock',
            type: 7,
            required: false,
            channel_types: [ChannelType.GuildText]
        }
    ],
    userPerms: ['ManageChannels'],
    botPerms: ['ManageChannels'],

    async slashExecute(interaction, client) {
        const isOwner = client.owners.includes(interaction.user.id);
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Manage Channels\` permissions.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        const channel = interaction.options.getChannel('channel') || interaction.channel;

        if (channel.type !== ChannelType.GuildText) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} Please provide a valid text channel.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        try {
            const isUnlocked = channel.permissionsFor(interaction.guild.roles.everyone).has(PermissionFlagsBits.SendMessages);

            if (isUnlocked) {
                const display = new TextDisplayBuilder().setContent(`${emoji.warn} ${channel} is already unlocked.`);
                return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
            }

            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null
            });

            const display = new TextDisplayBuilder().setContent(`${emoji.check} ${channel} has been unlocked.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} Failed to unlock channel: ${error.message}`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }
    },

    async execute(message, args, client) {
        const isOwner = client.owners.includes(message.author.id);
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Manage Channels\` permissions.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        let channel = message.channel;
        if (args.length > 0) {
            const channelId = args[0].replace(/[<#>]/g, '');
            channel = message.guild.channels.cache.get(channelId);
            if (!channel || channel.type !== ChannelType.GuildText) {
                const display = new TextDisplayBuilder().setContent(`${emoji.warn} Please provide a valid text channel.`);
                return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
            }
        }

        try {
            const isUnlocked = channel.permissionsFor(message.guild.roles.everyone).has(PermissionFlagsBits.SendMessages);

            if (isUnlocked) {
                const display = new TextDisplayBuilder().setContent(`${emoji.warn} ${channel} is already unlocked.`);
                return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
            }

            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: null
            });

            const display = new TextDisplayBuilder().setContent(`${emoji.check} ${channel} has been unlocked.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} Failed to unlock channel: ${error.message}`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }
    }
};

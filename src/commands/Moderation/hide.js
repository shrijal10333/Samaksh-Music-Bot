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
    name: 'hide',
    description: 'Hides the specified channel',
    category: 'Moderation',
    usage: 'hide [channel]',
    example: 'hide #general',
    slashOptions: [
        {
            name: 'channel',
            description: 'The channel to hide',
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
            const isHidden = !channel.permissionsFor(interaction.guild.roles.everyone).has(PermissionFlagsBits.ViewChannel);

            if (isHidden) {
                const display = new TextDisplayBuilder().setContent(`${emoji.warn} ${channel} is already hidden.`);
                return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
            }

            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                ViewChannel: false
            });

            const display = new TextDisplayBuilder().setContent(`${emoji.check} ${channel} has been hidden.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} Failed to hide channel: ${error.message}`);
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
            const isHidden = !channel.permissionsFor(message.guild.roles.everyone).has(PermissionFlagsBits.ViewChannel);

            if (isHidden) {
                const display = new TextDisplayBuilder().setContent(`${emoji.warn} ${channel} is already hidden.`);
                return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
            }

            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                ViewChannel: false
            });

            const display = new TextDisplayBuilder().setContent(`${emoji.check} ${channel} has been hidden.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} Failed to hide channel: ${error.message}`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }
    }
};

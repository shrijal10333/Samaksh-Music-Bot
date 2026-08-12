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
    name: 'unlockall',
    description: 'Unlocks all text channels in the server',
    category: 'Moderation',
    usage: 'unlockall',
    example: 'unlockall',
    userPerms: ['ManageChannels'],
    botPerms: ['ManageChannels'],

    async slashExecute(interaction, client) {
        const isOwner = client.owners.includes(interaction.user.id);
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Manage Channels\` permissions.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        return module.exports.executeLogic(interaction, client, true);
    },

    async execute(message, args, client) {
        const isOwner = client.owners.includes(message.author.id);
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Manage Channels\` permissions.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        return module.exports.executeLogic(message, client, false);
    },

    async executeLogic(context, client, isSlash) {
        const guild = context.guild;

        if (isSlash) await context.reply({ content: `${emoji.load} Unlocking all channels...` });
        else var waitMsg = await context.reply({ content: `${emoji.load} Unlocking all channels...` });

        try {
            const channels = guild.channels.cache.filter(c =>
                c.type === ChannelType.GuildText &&
                !c.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.SendMessages)
            );

            if (channels.size === 0) {
                const display = new TextDisplayBuilder().setContent(`${emoji.warn} All text channels are already unlocked.`);
                const container = new ContainerBuilder().addTextDisplayComponents(display);
                if (isSlash) return context.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
                return waitMsg.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
            }

            let count = 0;
            for (const [id, channel] of channels) {
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: null
                }).catch(() => { });
                count++;
            }

            const display = new TextDisplayBuilder().setContent(`${emoji.check} Unlocked **${count}** text channels.`);
            const container = new ContainerBuilder().addTextDisplayComponents(display);

            if (isSlash) {
                return context.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            } else {
                return waitMsg.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
            }
        } catch (error) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} Failed to unlock all channels: ${error.message}`);
            const container = new ContainerBuilder().addTextDisplayComponents(display);
            if (isSlash) return context.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            return waitMsg.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }
    }
};

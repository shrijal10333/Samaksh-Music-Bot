const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'invitetracking',
    aliases: ['invitetrack', 'trackinvites'],
    description: "Enable or disable invite tracking for this server",
    category: 'Tracker',
    userPerms: ['ManageGuild'],
    botPerms: ['ManageGuild'],
    slashOptions: [
        {
            name: "action",
            description: "Enable or disable invite tracking",
            type: 3,
            required: true,
            choices: [
                { name: "Enable", value: "enable" },
                { name: "Disable", value: "disable" }
            ]
        }
    ],

    async slashExecute(interaction, client) {
        const action = interaction.options.getString("action");

        const interactionWrapper = {
            guild: interaction.guild,
            channel: interaction.channel,
            author: interaction.user,
            member: interaction.member,
            reply: async (options) => {
                if (interaction.deferred) {
                    return await interaction.editReply(options);
                } else if (interaction.replied) {
                    return await interaction.followUp(options);
                } else {
                    return await interaction.reply(options);
                }
            },
        };

        const args = action ? [action] : [];
        return this.execute(interactionWrapper, args, client, client.prefix);
    },

    async execute(message, args, client) {
        try {

            const action = args[0]?.toLowerCase();

            if (action === 'enable') {
                client.db.invitetracking.set(message.guild.id, { status: 1 });

                const guildInvites = await message.guild.invites.fetch().catch(() => null);
                if (guildInvites) {
                    client.invites = client.invites || new Map();
                    const inviteCache = new Map();
                    guildInvites.forEach(invite => {
                        inviteCache.set(invite.code, {
                            uses: invite.uses,
                            inviter: invite.inviter
                        });
                    });
                    client.invites.set(message.guild.id, inviteCache);
                }

                const successDisplay = new TextDisplayBuilder()
                    .setContent(`Invite Tracking Status: \`Enabled\``);

                const separator = new SeparatorBuilder();

                const actionByDisplay = new TextDisplayBuilder()
                    .setContent(`-# Action by ${message.author.username} • <t:${Math.floor(Date.now() / 1000)}:t>`);

                const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(successDisplay)
                    .addSeparatorComponents(separator)
                    .addTextDisplayComponents(actionByDisplay);

                return message.reply({
                    components: [successContainer],
                    flags: MessageFlags.IsComponentsV2
                });

            } else if (action === 'disable') {
                client.db.invitetracking.set(message.guild.id, { status: 0 });

                if (client.invites?.has(message.guild.id)) {
                    client.invites.delete(message.guild.id);
                }

                const successDisplay = new TextDisplayBuilder()
                    .setContent(`Invite Tracking Status: \`Disabled\``);

                const separator = new SeparatorBuilder();

                const actionByDisplay = new TextDisplayBuilder()
                    .setContent(`-# Action by ${message.author.username} • <t:${Math.floor(Date.now() / 1000)}:t>`);

                const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(successDisplay)
                    .addSeparatorComponents(separator)
                    .addTextDisplayComponents(actionByDisplay);

                return message.reply({
                    components: [successContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            }

            const current = client.db.invitetracking.get(message.guild.id);
            const isEnabled = current?.status === 1;

            const statusDisplay = new TextDisplayBuilder()
                .setContent(`Invite Tracking Status: \`${isEnabled ? 'Enabled' : 'Disabled'}\``);

            const separator = new SeparatorBuilder();

            const actionByDisplay = new TextDisplayBuilder()
                .setContent(`Action by: ${message.author.tag}`);

            const enableButton = new ButtonBuilder()
                .setCustomId('invitetrack_enable')
                .setLabel('Enable')
                .setStyle(ButtonStyle.Success);

            const disableButton = new ButtonBuilder()
                .setCustomId('invitetrack_disable')
                .setLabel('Disable')
                .setStyle(ButtonStyle.Danger);

            if (isEnabled) {
                enableButton.setDisabled(true);
            } else {
                disableButton.setDisabled(true);
            }

            const buttonRow = new ActionRowBuilder().addComponents(enableButton, disableButton);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(statusDisplay)
                .addSeparatorComponents(separator)
                .addTextDisplayComponents(actionByDisplay)
                .addActionRowComponents(buttonRow);

            const response = await message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.Button,
                max: 1,
                time: 60000,
                filter: (interaction) => interaction.user.id === message.author.id
            });

            collector.on('collect', async (interaction) => {
                try {
                    if (interaction.customId === 'invitetrack_enable') {
                        client.db.invitetracking.set(message.guild.id, { status: 1 });

                        const guildInvites = await message.guild.invites.fetch().catch(() => null);
                        if (guildInvites) {
                            client.invites = client.invites || new Map();
                            const inviteCache = new Map();
                            guildInvites.forEach(invite => {
                                inviteCache.set(invite.code, {
                                    uses: invite.uses,
                                    inviter: invite.inviter
                                });
                            });
                            client.invites.set(message.guild.id, inviteCache);
                        }

                        const successDisplay = new TextDisplayBuilder()
                            .setContent(`Invite Tracking Status: \`Enabled\``);

                        const separator = new SeparatorBuilder();

                        const actionByDisplay = new TextDisplayBuilder()
                            .setContent(`Action by: ${interaction.user.tag}`);

                        const successContainer = new ContainerBuilder()
                            .addTextDisplayComponents(successDisplay)
                            .addSeparatorComponents(separator)
                            .addTextDisplayComponents(actionByDisplay);

                        await interaction.update({
                            components: [successContainer],
                            flags: MessageFlags.IsComponentsV2
                        });

                    } else if (interaction.customId === 'invitetrack_disable') {
                        client.db.invitetracking.set(message.guild.id, { status: 0 });

                        if (client.invites?.has(message.guild.id)) {
                            client.invites.delete(message.guild.id);
                        }

                        const successDisplay = new TextDisplayBuilder()
                            .setContent(`Invite Tracking Status: \`Disabled\``);

                        const separator = new SeparatorBuilder();

                        const actionByDisplay = new TextDisplayBuilder()
                            .setContent(`Action by: ${interaction.user.tag}`);

                        const successContainer = new ContainerBuilder()
                            .addTextDisplayComponents(successDisplay)
                            .addSeparatorComponents(separator)
                            .addTextDisplayComponents(actionByDisplay);

                        await interaction.update({
                            components: [successContainer],
                            flags: MessageFlags.IsComponentsV2
                        });
                    }

                } catch (error) {
                    console.error('Error in invitetracking button interaction:', error);

                    const errorDisplay = new TextDisplayBuilder()
                        .setContent(`### ${client.emoji.cross} **Error Occurred**`);

                    const separator = new SeparatorBuilder();

                    const errorInfo = new TextDisplayBuilder()
                        .setContent(`An error occurred while updating invite tracking. Please try again.`);

                    const errorContainer = new ContainerBuilder()
                        .addTextDisplayComponents(errorDisplay)
                        .addSeparatorComponents(separator)
                        .addTextDisplayComponents(errorInfo);

                    await interaction.reply({
                        components: [errorContainer],
                        flags: MessageFlags.IsComponentsV2
                    }).catch(() => { });
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    const timeoutDisplay = new TextDisplayBuilder()
                        .setContent(`Invite Tracking Status: \`${isEnabled ? 'Enabled' : 'Disabled'}\``);

                    const separator = new SeparatorBuilder();

                    const timeoutInfo = new TextDisplayBuilder()
                        .setContent(`-# Invite tracking settings menu timed out!`);

                    const timeoutContainer = new ContainerBuilder()
                        .addTextDisplayComponents(timeoutDisplay)
                        .addSeparatorComponents(separator)
                        .addTextDisplayComponents(timeoutInfo);

                    response.edit({
                        components: [timeoutContainer],
                        flags: MessageFlags.IsComponentsV2
                    }).catch(() => { });
                }
            });

        } catch (error) {
            console.error('Error in invitetracking command:', error);

            const errorDisplay = new TextDisplayBuilder()
                .setContent(`### ${client.emoji.cross} **Error Occurred**`);

            const separator = new SeparatorBuilder();

            const errorInfo = new TextDisplayBuilder()
                .setContent(`An error occurred while loading invite tracking settings. Please try again later.`);

            const errorContainer = new ContainerBuilder()
                .addTextDisplayComponents(errorDisplay)
                .addSeparatorComponents(separator)
                .addTextDisplayComponents(errorInfo);

            return message.reply({
                components: [errorContainer],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};

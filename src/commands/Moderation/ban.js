const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    ComponentType,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    PermissionFlagsBits
} = require('discord.js');
const emoji = require('../../emojis');

module.exports = {
    name: 'ban',
    description: 'Ban a member from the server',
    category: 'Moderation',
    usage: 'ban <user> [reason]',
    example: 'ban @user Breaking rules',
    slashOptions: [
        {
            name: 'user',
            description: 'The user to ban',
            type: 6,
            required: true
        },
        {
            name: 'reason',
            description: 'Reason for banning',
            type: 3,
            required: false
        }
    ],
    userPerms: ['BanMembers'],
    botPerms: ['BanMembers'],

    async slashExecute(interaction, client) {
        const isOwner = client.owners.includes(interaction.user.id);
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Ban Members\` permissions to use this command.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I don't have \`Ban Members\` permissions.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const reason = interaction.options.getString('reason');

        if (targetUser.id === interaction.user.id) return interaction.reply({ content: `${emoji.warn} You cannot ban yourself.` });
        if (targetUser.id === client.user.id) return interaction.reply({ content: `${emoji.warn} I cannot ban myself.` });
        if (targetMember && !targetMember.bannable) return interaction.reply({ content: `${emoji.warn} I cannot ban this member.` });

        const confirmId = `ban_confirm_${Date.now()}`;
        const cancelId = `ban_cancel_${Date.now()}`;

        const confirmButton = new ButtonBuilder().setCustomId(confirmId).setLabel('Confirm').setStyle(ButtonStyle.Danger);
        const cancelButton = new ButtonBuilder().setCustomId(cancelId).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.warn} **Ban Confirmation !**`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `${emoji.blank}${emoji.wickarrow} **Target:** [\`${targetUser.username}\`](https://discord.com/users/${targetUser.id})` +
                (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '') +
                ` \n\n*Are you sure you want to ban this member?*`
            ));

        await interaction.reply({
            components: [container, row],
            flags: MessageFlags.IsComponentsV2,
            withResponse: true
        });

        const response = await interaction.fetchReply();

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 20000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: `${emoji.warn} This is not for you.`, ephemeral: true });

            if (i.customId === cancelId) {
                collector.stop('cancelled');
                const cancelDisplay = new TextDisplayBuilder().setContent(`${emoji.cross} Ban action cancelled.`);
                return i.update({ components: [new ContainerBuilder().addTextDisplayComponents(cancelDisplay)], flags: MessageFlags.IsComponentsV2 });
            }

            if (i.customId === confirmId) {
                collector.stop('confirmed');
                await i.deferUpdate();

                let dmSent = false;
                try {
                    const section = new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `${emoji.blank}${emoji.wickarrow} **Server:** \` ${interaction.guild.name} \` \n` +
                                `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${interaction.user.displayName}\`](https://discord.com/users/${interaction.user.id})` +
                                (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '')
                            )
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ extension: 'png', size: 512 })));

                    const dmContainer = new ContainerBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.warn} **You have been Banned !**`))
                        .addSeparatorComponents(new SeparatorBuilder())
                        .addSectionComponents(section);

                    await targetUser.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
                    dmSent = true;
                } catch { }

                try {
                    await interaction.guild.members.ban(targetUser.id, { reason });

                    const section = new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `${emoji.blank}${emoji.wickarrow} **Target:** [\`${targetUser.username}\`](https://discord.com/users/${targetUser.id})\n` +
                                `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${interaction.user.displayName}\`](https://discord.com/users/${interaction.user.id})` +
                                (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '') +
                                `\n${emoji.blank}${emoji.wickarrow} **DMed:** ${dmSent ? emoji.check : emoji.cross}`
                            )
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ extension: 'png', size: 512 })));

                    const successContainer = new ContainerBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.check} **Member Banned !**`))
                        .addSeparatorComponents(new SeparatorBuilder())
                        .addSectionComponents(section);

                    return interaction.editReply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
                } catch (error) {
                    return interaction.editReply({ content: `${emoji.warn} Failed to ban: ${error.message}`, components: [] });
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                const timeoutDisplay = new TextDisplayBuilder().setContent(`${emoji.cross} This confirmation has timed out.`);
                interaction.editReply({ components: [new ContainerBuilder().addTextDisplayComponents(timeoutDisplay)], flags: MessageFlags.IsComponentsV2 }).catch(() => { });
            }
        });
    },

    async execute(message, args, client) {
        const isOwner = client.owners.includes(message.author.id);
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Ban Members\` permissions to use this command.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (args.length === 0) {
            const header = new TextDisplayBuilder().setContent(`${emoji.info} **Ban Command !**\n-# Requested by ${message.author.username} • <t:${Math.floor(Date.now() / 1000)}:t>`);
            const usage = new TextDisplayBuilder().setContent(`${emoji.blank}${emoji.wickarrow} **Usage:** \`ban <user> [reason]\`\n${emoji.blank}${emoji.wickarrow} **Example:** \`ban @user Rules\``);
            const container = new ContainerBuilder().addTextDisplayComponents(header).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(usage);
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }

        const userMention = args[0];
        const userIdToBan = userMention.replace(/[<@!>]/g, '');
        let targetUser = await client.users.fetch(userIdToBan).catch(() => null);

        if (!targetUser) {
            const search = userMention.toLowerCase();
            const foundMember = message.guild.members.cache.find(m =>
                m.user.username.toLowerCase() === search ||
                m.displayName.toLowerCase() === search ||
                m.user.tag.toLowerCase() === search
            );
            if (foundMember) targetUser = foundMember.user;
        }

        if (!targetUser) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} User not found.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        const targetMember = await message.guild.members.fetch(targetUser.id).catch(() => null);
        const reason = args.slice(1).join(' ');

        if (targetUser.id === message.author.id) return message.reply(`${emoji.warn} You cannot ban yourself.`);
        if (targetMember && !targetMember.bannable) return message.reply(`${emoji.warn} I cannot ban this member.`);

        const confirmId = `ban_confirm_${Date.now()}`;
        const cancelId = `ban_cancel_${Date.now()}`;

        const confirmButton = new ButtonBuilder().setCustomId(confirmId).setLabel('Confirm').setStyle(ButtonStyle.Danger);
        const cancelButton = new ButtonBuilder().setCustomId(cancelId).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const details = new TextDisplayBuilder().setContent(
            `${emoji.blank}${emoji.wickarrow} **Target:** [\`${targetUser.username}\`](https://discord.com/users/${targetUser.id})` +
            (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '') +
            ` \n\n*Are you sure you want to ban this member?*`
        );
        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.warn} **Ban Confirmation !**`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(details);

        const response = await message.reply({ components: [container, row], flags: MessageFlags.IsComponentsV2 });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 20000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== message.author.id) return i.reply({ content: `${emoji.warn} This is not for you.`, ephemeral: true });

            if (i.customId === cancelId) {
                collector.stop('cancelled');
                const cancelDisplay = new TextDisplayBuilder().setContent(`${emoji.cross} Ban action cancelled.`);
                return i.update({ components: [new ContainerBuilder().addTextDisplayComponents(cancelDisplay)], flags: MessageFlags.IsComponentsV2 });
            }

            if (i.customId === confirmId) {
                collector.stop('confirmed');
                await i.deferUpdate();

                let dmSent = false;
                try {
                    const section = new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `${emoji.blank}${emoji.wickarrow} **Server:** \` ${message.guild.name} \` \n` +
                                `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${message.author.displayName}\`](https://discord.com/users/${message.author.id})` +
                                (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '')
                            )
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ extension: 'png', size: 512 })));

                    const dmContainer = new ContainerBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.warn} **You have been Banned !**`))
                        .addSeparatorComponents(new SeparatorBuilder())
                        .addSectionComponents(section);

                    await targetUser.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
                    dmSent = true;
                } catch { }

                try {
                    await message.guild.members.ban(targetUser.id, { reason });

                    const section = new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `${emoji.blank}${emoji.wickarrow} **Target:** [\`${targetUser.username}\`](https://discord.com/users/${targetUser.id})\n` +
                                `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${message.author.displayName}\`](https://discord.com/users/${message.author.id})` +
                                (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '') +
                                `\n${emoji.blank}${emoji.wickarrow} **DMed:** ${dmSent ? emoji.check : emoji.cross}`
                            )
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ extension: 'png', size: 512 })));

                    const successContainer = new ContainerBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.check} **Member Banned !**`))
                        .addSeparatorComponents(new SeparatorBuilder())
                        .addSectionComponents(section);

                    return i.editReply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
                } catch (error) {
                    return i.editReply({ content: `${emoji.warn} Failed to ban: ${error.message}`, components: [] });
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                const timeoutDisplay = new TextDisplayBuilder().setContent(`${emoji.cross} This confirmation has timed out.`);
                response.edit({ components: [new ContainerBuilder().addTextDisplayComponents(timeoutDisplay)], flags: MessageFlags.IsComponentsV2 }).catch(() => { });
            }
        });
    }
};

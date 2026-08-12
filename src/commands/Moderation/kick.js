const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');
const emoji = require('../../emojis');

module.exports = {
    name: 'kick',
    description: 'Kick a member from the server',
    category: 'Moderation',
    usage: 'kick <user> [reason]',
    example: 'kick @user Breaking server rules',
    slashOptions: [
        {
            name: 'user',
            description: 'The user to kick',
            type: 6,
            required: true
        },
        {
            name: 'reason',
            description: 'Reason for kicking',
            type: 3,
            required: false
        }
    ],
    userPerms: ['KickMembers'],
    botPerms: ['KickMembers'],

    async slashExecute(interaction, client) {
        const isOwner = client.owners.includes(interaction.user.id);
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Kick Members\` permissions to use this command.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I don't have \`Kick Members\` permissions.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const targetUser = interaction.options.getUser('user');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const reason = interaction.options.getString('reason');

        if (!targetMember) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} User not found in this server.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (targetMember.id === interaction.user.id) return interaction.reply({ content: `${emoji.warn} You cannot kick yourself.`, ephemeral: true });
        if (targetMember.id === client.user.id) return interaction.reply({ content: `${emoji.warn} I cannot kick myself.`, ephemeral: true });
        if (targetMember.id === interaction.guild.ownerId) return interaction.reply({ content: `${emoji.warn} You cannot kick the server owner.`, ephemeral: true });

        if (interaction.member.roles.highest.position <= targetMember.roles.highest.position && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You cannot kick a member with equal or higher role than you.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (interaction.guild.members.me.roles.highest.position <= targetMember.roles.highest.position) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I cannot kick a member with equal or higher role than me.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (!targetMember.kickable) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I cannot kick this member.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        let dmSent = false;
        try {
            const invite = await interaction.guild.invites.create(interaction.channelId, { maxAge: 0 }).catch(() => null);
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
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.warn} **You have been Kicked !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            const components = [dmContainer];
            if (invite) {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel(`Server Link`).setStyle(ButtonStyle.Link).setURL(invite.url)
                );
                components.push(row);
            }

            await targetMember.send({ components, flags: MessageFlags.IsComponentsV2 }).catch(() => null);
            dmSent = true;
        } catch { }

        try {
            await targetMember.kick(reason);

            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emoji.blank}${emoji.wickarrow} **Target:** [\`${targetUser.displayName}\`](https://discord.com/users/${targetUser.id})\n` +
                        `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${interaction.user.displayName}\`](https://discord.com/users/${interaction.user.id})` +
                        (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '') +
                        `\n${emoji.blank}${emoji.wickarrow} **DMed:** ${dmSent ? emoji.check : emoji.cross}`
                    )
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ extension: 'png', size: 512 })));

            const successContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.check} **Member Kicked !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            return interaction.reply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            return interaction.reply({ content: `${emoji.warn} Failed to kick: ${error.message}`, components: [] });
        }
    },

    async execute(message, args, client) {
        const userId = message.author?.id || message.user?.id;
        const isOwner = client.owners.includes(userId);

        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Kick Members\` permissions to use this command.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I don't have \`Kick Members\` permissions.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (args.length === 0) {
            const header = new TextDisplayBuilder().setContent(`${emoji.info} **Kick Command !**\n-# Requested by ${message.author.username} • <t:${Math.floor(Date.now() / 1000)}:t>`);
            const usage = new TextDisplayBuilder().setContent(`${emoji.blank}${emoji.wickarrow} **Usage:** \`kick <user> [reason]\`\n${emoji.blank}${emoji.wickarrow} **Example:** \`kick @user Rules\``);
            const container = new ContainerBuilder().addTextDisplayComponents(header).addSeparatorComponents(new SeparatorBuilder()).addTextDisplayComponents(usage);
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }

        const userMention = args[0];
        let targetMember;

        if (message.mentions.members.size > 0) {
            targetMember = message.mentions.members.first();
        } else {
            const userId = userMention.replace(/[<@!>]/g, '');
            targetMember = await message.guild.members.fetch(userId).catch(() => null);

            if (!targetMember) {
                const search = userMention.toLowerCase();
                targetMember = message.guild.members.cache.find(m =>
                    m.user.username.toLowerCase() === search ||
                    m.displayName.toLowerCase() === search ||
                    m.user.tag.toLowerCase() === search
                );
            }
        }

        if (!targetMember) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} User not found in this server.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        const reason = args.slice(1).join(' ');

        if (targetMember.id === message.author.id) return message.reply(`${emoji.warn} You cannot kick yourself.`);
        if (targetMember.id === client.user.id) return message.reply(`${emoji.warn} I cannot kick myself.`);
        if (targetMember.id === message.guild.ownerId) return message.reply(`${emoji.warn} You cannot kick the server owner.`);

        if (message.member.roles.highest.position <= targetMember.roles.highest.position && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You cannot kick a member with equal or higher role than you.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (message.guild.members.me.roles.highest.position <= targetMember.roles.highest.position) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I cannot kick a member with equal or higher role than me.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (!targetMember.kickable) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I cannot kick this member.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        let dmSent = false;
        try {
            const invite = await message.guild.invites.create(message.channelId, { maxAge: 0 }).catch(() => null);
            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emoji.blank}${emoji.wickarrow} **Server:** \` ${message.guild.name} \` \n` +
                        `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${message.author.displayName}\`](https://discord.com/users/${message.author.id})` +
                        (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '')
                    )
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetMember.user.displayAvatarURL({ extension: 'png', size: 512 })));

            const dmContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.warn} **You have been Kicked !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            const components = [dmContainer];
            if (invite) {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setLabel(`Server Link`).setStyle(ButtonStyle.Link).setURL(invite.url)
                );
                components.push(row);
            }

            await targetMember.send({ components, flags: MessageFlags.IsComponentsV2 }).catch(() => null);
            dmSent = true;
        } catch { }

        try {
            await targetMember.kick(reason);
            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emoji.blank}${emoji.wickarrow} **Target:** [\`${targetMember.user.displayName}\`](https://discord.com/users/${targetMember.user.id})\n` +
                        `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${message.author.displayName}\`](https://discord.com/users/${message.author.id})` +
                        (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '') +
                        `\n${emoji.blank}${emoji.wickarrow} **DMed:** ${dmSent ? emoji.check : emoji.cross}`
                    )
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetMember.user.displayAvatarURL({ extension: 'png', size: 512 })));

            const successContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.check} **Member Kicked !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            return message.reply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            return message.reply({ content: `${emoji.warn} Failed to kick: ${error.message}`, components: [] });
        }
    }
};

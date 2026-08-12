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
    name: 'unmute',
    description: 'Remove timeout from a member',
    category: 'Moderation',
    usage: 'unmute <user> [reason]',
    example: 'unmute @user Appeal accepted',
    slashOptions: [
        {
            name: 'user',
            description: 'The user to unmute',
            type: 6,
            required: true
        },
        {
            name: 'reason',
            description: 'Reason for unmuting',
            type: 3,
            required: false
        }
    ],
    userPerms: ['ModerateMembers'],
    botPerms: ['ModerateMembers'],

    async slashExecute(interaction, client) {
        const isOwner = client.owners.includes(interaction.user.id);
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Moderate Members\` permissions to use this command.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I don't have \`Moderate Members\` permissions.`);
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

        if (!targetMember.isCommunicationDisabled()) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} This member is not muted.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (!targetMember.moderatable) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I cannot unmute this member.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

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
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.check} **You have been Unmuted !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            await targetMember.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
            dmSent = true;
        } catch { }

        try {
            await targetMember.timeout(null, reason);
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
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.check} **Member Unmuted !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            return interaction.reply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            return interaction.reply({ content: `${emoji.warn} Failed to unmute: ${error.message}`, components: [] });
        }
    },

    async execute(message, args, client) {
        const userId = message.author?.id || message.user?.id;
        const isOwner = client.owners.includes(userId);

        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Moderate Members\` permissions to use this command.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (args.length === 0) {
            const header = new TextDisplayBuilder().setContent(`${emoji.info} **Unmute Command !**\n-# Requested by ${message.author.username} • <t:${Math.floor(Date.now() / 1000)}:t>`);
            const usage = new TextDisplayBuilder().setContent(`${emoji.blank}${emoji.wickarrow} **Usage:** \`unmute <user> [reason]\`\n${emoji.blank}${emoji.wickarrow} **Example:** \`unmute @user Appeal accepted\``);
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

        if (!targetMember.isCommunicationDisabled()) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} This member is not muted.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        const reason = args.slice(1).join(' ');

        if (!targetMember.moderatable) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I cannot unmute this member.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

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
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetMember.user.displayAvatarURL({ extension: 'png', size: 512 })));

            const dmContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.check} **You have been Unmuted !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            await targetMember.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
            dmSent = true;
        } catch { }

        try {
            await targetMember.timeout(null, reason);
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
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.check} **Member Unmuted !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            return message.reply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            return message.reply({ content: `${emoji.warn} Failed to unmute: ${error.message}`, components: [] });
        }
    }
};

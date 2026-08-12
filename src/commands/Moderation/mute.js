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
    name: 'mute',
    description: 'Timeout a member in the server',
    category: 'Moderation',
    usage: 'mute <user> [duration] [reason]',
    example: 'mute @user 10m Spamming',
    slashOptions: [
        {
            name: 'user',
            description: 'The user to mute',
            type: 6,
            required: true
        },
        {
            name: 'duration',
            description: 'Duration (e.g. 10m, 2h, 3d) - Default: 10m',
            type: 3,
            required: false
        },
        {
            name: 'reason',
            description: 'Reason for muting',
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
        const durationStr = interaction.options.getString('duration') || '10m';
        const reason = interaction.options.getString('reason');

        if (!targetMember) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} User not found in this server.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const durationMs = parseDuration(durationStr);
        if (!durationMs) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} Invalid duration format. Use: 10s, 5m, 2h, 1d`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (durationMs > 2419200000) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} Duration cannot exceed 28 days.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (targetMember.isCommunicationDisabled()) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} This member is already muted.`);
            return interaction.reply({
                components: [new ContainerBuilder().addTextDisplayComponents(display)],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (targetMember.id === interaction.user.id) return interaction.reply({ content: `${emoji.warn} You cannot mute yourself.`, ephemeral: true });
        if (targetMember.id === client.user.id) return interaction.reply({ content: `${emoji.warn} I cannot mute myself.`, ephemeral: true });
        if (targetMember.user.bot) return interaction.reply({ content: `${emoji.warn} You cannot mute a bot.`, ephemeral: true });
        if (targetMember.id === interaction.guild.ownerId) return interaction.reply({ content: `${emoji.warn} You cannot mute the server owner.`, ephemeral: true });

        if (interaction.member.roles.highest.position <= targetMember.roles.highest.position && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You cannot mute a member with equal or higher role than you.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (interaction.guild.members.me.roles.highest.position <= targetMember.roles.highest.position) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I cannot mute a member with equal or higher role than me.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (!targetMember.moderatable) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I cannot mute this member.`);
            return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        let dmSent = false;
        try {
            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emoji.blank}${emoji.wickarrow} **Server:** \` ${interaction.guild.name} \` \n` +
                        `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${interaction.user.displayName}\`](https://discord.com/users/${interaction.user.id})\n` +
                        `${emoji.blank}${emoji.wickarrow} **Duration:** \`${durationStr}\`` +
                        (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '')
                    )
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ extension: 'png', size: 512 })));

            const dmContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.warn} **You have been Muted !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            await targetMember.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
            dmSent = true;
        } catch { }

        try {
            await targetMember.timeout(durationMs, reason);
            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emoji.blank}${emoji.wickarrow} **Target:** [\`${targetUser.displayName}\`](https://discord.com/users/${targetUser.id})\n` +
                        `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${interaction.user.displayName}\`](https://discord.com/users/${interaction.user.id})\n` +
                        `${emoji.blank}${emoji.wickarrow} **Duration:** \`${durationStr}\`` +
                        (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '') +
                        `\n${emoji.blank}${emoji.wickarrow} **DMed:** ${dmSent ? emoji.check : emoji.cross}`
                    )
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetUser.displayAvatarURL({ extension: 'png', size: 512 })));

            const successContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.check} **Member Muted !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            return interaction.reply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            return interaction.reply({ content: `${emoji.warn} Failed to mute: ${error.message}`, components: [] });
        }
    },

    async execute(message, args, client) {
        const userId = message.author?.id || message.user?.id;
        const isOwner = client.owners.includes(userId);

        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers) && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You need \`Moderate Members\` permissions to use this command.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (args.length < 1) {
            const header = new TextDisplayBuilder().setContent(`${emoji.info} **Mute Command !**\n-# Requested by ${message.author.username} • <t:${Math.floor(Date.now() / 1000)}:t>`);
            const usage = new TextDisplayBuilder().setContent(`${emoji.blank}${emoji.wickarrow} **Usage:** \`mute <user> [duration] [reason]\`\n${emoji.blank}${emoji.wickarrow} **Example:** \`mute @user 10m Spamming\``);
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

        let durationStr = '10m';
        let reasonStartIndex = 1;

        if (args[1]) {
            const testDuration = parseDuration(args[1]);
            if (testDuration) {
                durationStr = args[1];
                reasonStartIndex = 2;
            }
        }

        const durationMs = parseDuration(durationStr);
        if (!durationMs || durationMs > 2419200000) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} Invalid duration (max 28d). Use: 10m, 2h, 1d`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (targetMember.isCommunicationDisabled()) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} This member is already muted.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        const reason = args.slice(reasonStartIndex).join(' ');

        if (targetMember.id === message.author.id) return message.reply(`${emoji.warn} You cannot mute yourself.`);
        if (targetMember.id === client.user.id) return message.reply(`${emoji.warn} I cannot mute myself.`);
        if (targetMember.user.bot) return message.reply(`${emoji.warn} You cannot mute a bot.`);
        if (targetMember.id === message.guild.ownerId) return message.reply(`${emoji.warn} You cannot mute the server owner.`);

        if (message.member.roles.highest.position <= targetMember.roles.highest.position && !isOwner) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} You cannot mute a member with equal or higher role than you.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (message.guild.members.me.roles.highest.position <= targetMember.roles.highest.position) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I cannot mute a member with equal or higher role than me.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        if (!targetMember.moderatable) {
            const display = new TextDisplayBuilder().setContent(`${emoji.warn} I cannot mute this member.`);
            return message.reply({ components: [new ContainerBuilder().addTextDisplayComponents(display)], flags: MessageFlags.IsComponentsV2 });
        }

        let dmSent = false;
        try {
            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emoji.blank}${emoji.wickarrow} **Server:** \` ${message.guild.name} \` \n` +
                        `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${message.author.displayName}\`](https://discord.com/users/${message.author.id})\n` +
                        `${emoji.blank}${emoji.wickarrow} **Duration:** \`${durationStr}\`` +
                        (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '')
                    )
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetMember.user.displayAvatarURL({ extension: 'png', size: 512 })));

            const dmContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.warn} **You have been Muted !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            await targetMember.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
            dmSent = true;
        } catch { }

        try {
            await targetMember.timeout(durationMs, reason);
            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emoji.blank}${emoji.wickarrow} **Target:** [\`${targetMember.user.displayName}\`](https://discord.com/users/${targetMember.user.id})\n` +
                        `${emoji.blank}${emoji.wickarrow} **Moderator:** [\`${message.author.displayName}\`](https://discord.com/users/${message.author.id})\n` +
                        `${emoji.blank}${emoji.wickarrow} **Duration:** \`${durationStr}\`` +
                        (reason ? `\n${emoji.blank}${emoji.wickarrow} **Reason:** \`${reason}\`` : '') +
                        `\n${emoji.blank}${emoji.wickarrow} **DMed:** ${dmSent ? emoji.check : emoji.cross}`
                    )
                )
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(targetMember.user.displayAvatarURL({ extension: 'png', size: 512 })));

            const successContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.check} **Member Muted !**`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addSectionComponents(section);

            return message.reply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            return message.reply({ content: `${emoji.warn} Failed to mute: ${error.message}`, components: [] });
        }
    }
};

function parseDuration(str) {
    const units = { 's': 1000, 'm': 60000, 'h': 3600000, 'd': 86400000 };
    const match = str.toLowerCase().match(/^(\d+)([smhd])$/);
    return match ? parseInt(match[1]) * units[match[2]] : null;
}

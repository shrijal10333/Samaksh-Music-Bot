const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "inviteCreate",
    run: async (client, invite) => {
        try {
            if (!invite.guild) return;

            if (!invite.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) return;

            const guildInvites = await invite.guild.invites.fetch().catch(() => null);
            if (!guildInvites) return;

            client.invites = client.invites || new Map();

            const inviteCache = new Map();
            guildInvites.forEach(inv => {
                inviteCache.set(inv.code, {
                    uses: inv.uses,
                    inviter: inv.inviter
                });
            });
            client.invites.set(invite.guild.id, inviteCache);

        } catch (error) {
            console.error("Error in inviteCreate event:", error);
        }
    },
};

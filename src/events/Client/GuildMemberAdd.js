const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "guildMemberAdd",
  run: async (client, member) => {
    if (!member || !member.guild) return;

    try {
      const autoRoleData = client.db.autorole.get(member.guild.id);
      if (autoRoleData && autoRoleData.roles.length > 0) {
        for (const roleId of autoRoleData.roles) {
          const role = member.guild.roles.cache.get(roleId);
          if (role) {
            await member.roles.add(role).catch(() => { });
          }
        }
      }

      const trackingEnabled = client.db.invitetracking.get(member.guild.id);

      if (trackingEnabled && trackingEnabled.status === 1) {

        if (member.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
          await trackInvite(client, member);
        }
      }

    } catch (error) {
      console.error("Error in guildMemberAdd event:", error);
    }
  },
};

async function trackInvite(client, member) {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newInvites = await member.guild.invites.fetch().catch(() => null);
    if (!newInvites) return;

    const cachedInvites = client.invites?.get(member.guild.id);
    let usedInvite = null;
    let inviter = null;

    if (!cachedInvites) {
      client.invites = client.invites || new Map();
      const inviteCache = new Map();
      newInvites.forEach(invite => {
        inviteCache.set(invite.code, {
          uses: invite.uses,
          inviter: invite.inviter
        });
      });
      client.invites.set(member.guild.id, inviteCache);
    } else {
      for (const [code, newInvite] of newInvites) {
        const cachedInvite = cachedInvites.get(code);

        if (!cachedInvite) {
          if (newInvite.uses > 0) {
            usedInvite = newInvite;
            inviter = newInvite.inviter;
            break;
          }
        } else if (newInvite.uses > cachedInvite.uses) {
          usedInvite = newInvite;
          inviter = newInvite.inviter;
          break;
        }
      }

      const inviteCache = new Map();
      newInvites.forEach(invite => {
        inviteCache.set(invite.code, {
          uses: invite.uses,
          inviter: invite.inviter
        });
      });
      client.invites.set(member.guild.id, inviteCache);
    }

    const accountAge = Date.now() - member.user.createdTimestamp;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const isFake = accountAge < sevenDays;

    const previousJoin = client.db.invite_logs.get(member.guild.id, member.user.id);

    let isRejoin = false;
    if (previousJoin) {
      const tenDays = 10 * 24 * 60 * 60 * 1000;
      const timeSinceLastJoin = Date.now() - new Date(previousJoin.joinedAt).getTime();
      isRejoin = timeSinceLastJoin <= tenDays;
    }

    if (!inviter) {
      return;
    }

    client.db.invite_logs.create({
      guildId: member.guild.id,
      userId: member.user.id,
      inviterId: inviter.id,
      inviteCode: usedInvite.code,
      joinedAt: new Date().toISOString(),
      isLeft: 0,
      isFake: isFake ? 1 : 0,
      isRejoin: isRejoin ? 1 : 0
    });

  } catch (error) {
    console.error("Error tracking invite:", error);
  }
}

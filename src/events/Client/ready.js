const { prefix } = require("../../config.js");
const { ActivityType, REST, Routes, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "clientReady",
  run: async (client) => {
    client.logger.log(`${client.user.username} is now online.`, "ready");

    const giveawayManager = require("../../utils/giveawayManager");
    giveawayManager.init(client);

    const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require("discord.js");
    const rebootData = client.db.reboot.getAll()[0];
    if (rebootData) {
      client.db.reboot.delete(rebootData.id);
      const channel = client.channels.cache.get(rebootData.channelId);
      if (channel) {
        try {
          const msg = await channel.messages.fetch(rebootData.messageId);
          if (msg) {
            const restartedContainer = new ContainerBuilder()
              .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${client.emoji.check} Bot has been successfully restarted.**`))

            await msg.edit({
              components: [restartedContainer],
              flags: MessageFlags.IsComponentsV2
            });
          }
        } catch (e) { }
      }
    }

    client.invites = new Map();
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const trackingEnabled = client.db.invitetracking.get(guildId);

        if (!trackingEnabled || !trackingEnabled.status) continue;

        const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
        if (!me || !me.permissions.has(PermissionFlagsBits.ManageGuild)) continue;

        const invites = await guild.invites.fetch().catch(() => null);
        if (!invites) continue;

        const inviteCache = new Map();
        invites.forEach(invite => {
          inviteCache.set(invite.code, {
            uses: invite.uses,
            inviter: invite.inviter
          });
        });
        client.invites.set(guildId, inviteCache);
      } catch (error) {
      }
    }

    client.logger.log(
      `Ready on ${client.guilds.cache.size} servers, for a total of ${client.users.cache.size} users`,
      "ready",
    );

    for (const guild of client.guilds.cache.values()) {
      giveawayManager.syncGiveaways(client, guild).catch(() => { });
    }

    if (client.slashCommands.size > 0) {
      const rest = new REST({ version: "10" }).setToken(client.token);
      try {
        const commands = Array.from(client.slashCommands.values()).map((cmd) => {
          const commandData = {
            name: cmd.name,
            description: cmd.description,
            options: cmd.options || [],
          };

          if (cmd.owner) {
            commandData.default_member_permissions = "8";
            commandData.dm_permission = false;
          } else if (cmd.userPerms && cmd.userPerms.length > 0) {
            const { PermissionsBitField } = require("discord.js");
            try {
              commandData.default_member_permissions = PermissionsBitField.resolve(cmd.userPerms).toString();
            } catch (e) {
              console.error(`Error resolving perms for ${cmd.name}:`, e);
            }
          }

          return commandData;
        });

        client.logger.log(`Deploying ${commands.length} slash commands...`, "cmd");

        await rest.put(Routes.applicationCommands(client.user.id), {
          body: commands,
        });

        client.logger.log(`Successfully deployed ${commands.length} slash commands.`, "cmd");
      } catch (error) {
        console.error("Error deploying slash commands:", error);
      }
    } else {
      console.log("\n⚠️ WARNING: No slash commands to deploy! client.slashCommands.size = 0\n");
    }

    setInterval(() => {
      const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
      const statuses = [
        `Serving ${client.guilds.cache.size} Guilds | ${client.users.cache.size} Users`,
        `Use /help to get started`,
        `Pure Musical Bliss!`,
        `High Quality | 24/7 Music`
      ];

      const status = statuses[Math.floor(Math.random() * statuses.length)];

      client.user.setPresence({
        activities: [
          {
            name: status,
            type: ActivityType.Custom,
          },
        ],
        status: "online",
      });
    }, 7000);
  },
};

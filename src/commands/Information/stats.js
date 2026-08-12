const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
} = require("discord.js");
const os = require("os");
const moment = require("moment");
require("moment-duration-format");

module.exports = {
  name: "stats",
  category: "Information",
  description: "Show detailed bot statistics",
  args: false,
  usage: "",
  aliases: ["statistics", "botinfo", "bi"],
  userPerms: [],
  owner: false,
  slashOptions: [],
  async slashExecute(interaction, client) {
    const interactionWrapper = {
      guild: interaction.guild,
      channel: interaction.channel,
      author: interaction.user,
      member: interaction.member,
      createdTimestamp: interaction.createdTimestamp,
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

    const args = [];
    if (interaction.options) {
      const options = interaction.options.data;
      for (const option of options) {
        if (option.value !== undefined) {
          args.push(option.value.toString());
        }
      }
    }

    const prefix = client.prefix;
    return this.execute(interactionWrapper, args, client, prefix);
  },
  async execute(message, args, client, prefix) {
    const guildCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;
    const shardId = (message.guild?.shardId || 0) + 1;
    const totalShards = client.shard?.count || 1;

    const manager = client.manager;
    const players = Array.from(manager.players.values());
    const totalPlayers = players.length;
    const playingPlayers = players.filter(p => p.playing).length;
    const idlePlayers = totalPlayers - playingPlayers;

    const processUptime = process.uptime();
    let uptime;
    if (processUptime >= 86400) {
      uptime = moment.duration(processUptime * 1000).format("d[d] h[h] m[m]");
    } else if (processUptime >= 3600) {
      uptime = moment.duration(processUptime * 1000).format("h[h] m[m] s[s]");
    } else {
      uptime = moment.duration(processUptime * 1000).format("m[m] s[s]");
    }

    const cpuModel = os.cpus()[0]?.model.split(' @')[0].trim();
    const platform = os.platform().charAt(0).toUpperCase() + os.platform().slice(1);

    const load = os.loadavg();
    const systemLoad = ((load[0] * 100) / os.cpus().length).toFixed(1);

    const processRam = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

    const numb = (n) => client.numb ? client.numb(n) : n;

    const esc = "\u001b";
    const yellow = `${esc}[1;33m`;
    const gray = `${esc}[1;30m`;
    const blue = `${esc}[1;34m`;
    const white = `${esc}[1;37m`;
    const reset = `${esc}[0m`;

    const pad = (str, n) => str + " ".repeat(Math.max(0, n - str.length));

    const botStatsHeader = new TextDisplayBuilder()
      .setContent(`**Bot Statistics**`);

    const botStatsBlock = new TextDisplayBuilder()
      .setContent(`\`\`\`ansi\n` +
        ` ${yellow}• ${reset} ${yellow}${pad("Presence", 11)} ${reset} ${blue}::\n` +
        `   ${gray}L ${reset} ${gray}${pad("Servers", 9)} ${reset} ${blue}: ${reset} ${white}${numb(guildCount)} ${reset}\n` +
        `   ${gray}L ${reset} ${gray}${pad("Users", 9)} ${reset} ${blue}: ${reset} ${white}${numb(userCount)} ${reset}\n` +
        `   ${gray}L ${reset} ${gray}${pad("Shard", 9)} ${reset} ${blue}: ${reset} ${white}${shardId}/${totalShards} ${reset}\n` +
        ` ${yellow}• ${reset} ${yellow}${pad("Music", 11)} ${reset} ${blue}::\n` +
        `   ${gray}L ${reset} ${gray}${pad("Players", 9)} ${reset} ${blue}: ${reset} ${white}${totalPlayers} ${reset}\n` +
        `   ${gray}L ${reset} ${gray}${pad("Playing", 9)} ${reset} ${blue}: ${reset} ${white}${playingPlayers} ${reset}\n` +
        `   ${gray}L ${reset} ${gray}${pad("Idle", 9)} ${reset} ${blue}: ${reset} ${white}${idlePlayers} ${reset}\n` +
        ` ${yellow}• ${reset} ${yellow}${pad("Performance", 11)} ${reset} ${blue}::\n` +
        `   ${gray}L ${reset} ${gray}${pad("Ping", 9)} ${reset} ${blue}: ${reset} ${white}${client.ws.ping}ms ${reset}\n` +
        `   ${gray}L ${reset} ${gray}${pad("Uptime", 9)} ${reset} ${blue}: ${reset} ${white}${uptime} ${reset}\n` +
        `\`\`\``);

    const systemStatsHeader = new TextDisplayBuilder()
      .setContent(`**System Infrastructure**`);

    const systemStatsBlock = new TextDisplayBuilder()
      .setContent(`\`\`\`ansi\n` +
        ` ${yellow}• ${reset} ${yellow}${pad("Hardware", 11)} ${reset} ${blue}:: ${reset} ${white}${cpuModel} ${reset}\n` +
        `   ${gray}L ${reset} ${gray}${pad("CPU Load", 9)} ${reset} ${blue}: ${reset} ${white}${systemLoad}% ${reset}\n` +
        `   ${gray}L ${reset} ${gray}${pad("Bot RAM", 9)} ${reset} ${blue}: ${reset} ${white}${processRam} MB ${reset}\n` +
        ` ${yellow}• ${reset} ${yellow}${pad("Software", 11)} ${reset} ${blue}:: ${reset} ${white}${platform} ${reset}\n` +
        `   ${gray}L ${reset} ${gray}${pad("Node.js", 9)} ${reset} ${blue}: ${reset} ${white}${process.version} ${reset}\n` +
        `   ${gray}L ${reset} ${gray}${pad("D.JS", 9)} ${reset} ${blue}: ${reset} ${white}v${require('discord.js').version} ${reset}\n` +
        `\`\`\``);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(botStatsHeader)
      .addTextDisplayComponents(botStatsBlock)
      .addTextDisplayComponents(systemStatsHeader)
      .addTextDisplayComponents(systemStatsBlock);

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};

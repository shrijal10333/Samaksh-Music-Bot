const {
  WebhookClient,
  ComponentType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder
} = require("discord.js");
const { player_create } = require("../../config").Webhooks;

const createButtonRow = (client, paused) => {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("previous")
      .setEmoji(client.emoji.previous)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(paused ? "resume" : "pause")
      .setEmoji(paused ? client.emoji.play : client.emoji.pause)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("skip")
      .setEmoji(client.emoji.skip)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("like")
      .setEmoji(client.emoji.like)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("stop")
      .setEmoji(client.emoji.stop)
      .setStyle(ButtonStyle.Secondary)
  );
};

function formatDuration(ms) {
  if (!ms || ms === 0) return 'Unknown';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function cleanAuthorName(author) {
  if (!author) return 'Unknown Artist';

  return author.replace(/\s*-\s*Topic\s*$/i, '').trim();
}

function truncateTitle(title, maxLength = 30) {
  if (!title) return 'Unknown Title';
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
}

function getCleanThumbnail(thumbnailUrl) {
  if (!thumbnailUrl) return null;

  if (thumbnailUrl.includes('i.ytimg.com') || thumbnailUrl.includes('img.youtube.com')) {
    const videoIdMatch = thumbnailUrl.match(/vi\/([^\/]+)\//);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://i.ytimg.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
    }
  }

  return thumbnailUrl;
}

function buildNowPlayingContainer(client, track, paused) {
  const titleDisplay = new TextDisplayBuilder()
    .setContent(`### [${truncateTitle(track.title)}](${track.uri || track.url})`);

  const infoDisplay = new TextDisplayBuilder()
    .setContent(
      `> - **Author:** [${cleanAuthorName(track.author)}](${track.uri || track.url})\n` +
      `> - **Duration:** \`${formatDuration(track.length || track.duration || 0)}\`\n` +
      `> - **Requester:** [${track.requester?.username}](https://discord.com/users/${track.requester?.id})`
    );

  const section = new SectionBuilder()
    .addTextDisplayComponents(titleDisplay, infoDisplay);

  if (track.thumbnail || track.artworkUrl || track.image) {
    const cleanThumbnail = getCleanThumbnail(track.thumbnail || track.artworkUrl || track.image);
    if (cleanThumbnail) {
      section.setThumbnailAccessory((thumbnail) =>
        thumbnail.setURL(cleanThumbnail)
      );
    }
  }

  const container = new ContainerBuilder()
    .addSectionComponents(section);

  const buttonRow = createButtonRow(client, paused);
  container.addActionRowComponents(buttonRow);

  return container;
}

async function sendNowPlaying(client, player, track) {
  try {
    const channel = client.channels.cache.get(player.textId);
    if (!channel) {
      return null;
    }

    const container = buildNowPlayingContainer(client, track, player.paused || false);

    try {
      const message = await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      player.data?.set("currentTrack", track);
      return message;
    } catch (embedError) {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function updateNowPlayingButtons(client, player, paused) {
  try {
    const nowPlayingMsg = player.data?.get("message");
    if (!nowPlayingMsg) {
      return;
    }

    const track = player.data?.get("currentTrack") || player.queue?.current;
    if (!track) {
      return;
    }

    const container = buildNowPlayingContainer(client, track, paused);

    await nowPlayingMsg.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    }).catch((err) => {
    });

  } catch (error) {
  }
}

async function handleButtonInteraction(interaction, player, client) {
  try {
    switch (interaction.customId) {
      case "pause":
        if (player.paused) {
          return interaction.deferUpdate();
        }

        player.pause(true);
        await updateNowPlayingButtons(client, player, true);
        await interaction.deferUpdate();
        break;

      case "resume":
        if (!player.paused) {
          return interaction.deferUpdate();
        }
        player.pause(false);
        await updateNowPlayingButtons(client, player, false);
        await interaction.deferUpdate();
        break;

      case "skip":
        if (!player.queue?.current) {
          return interaction.deferUpdate();
        }
        player.skip();
        await interaction.deferUpdate();
        break;

      case "stop":
        try {
          player.queue?.clear();
          if (player.setLoop) {
            player.setLoop('none');
          } else {
            player.loop = 'none';
          }
          const { safeDestroyPlayer } = require("../../utils/playerUtils");
          await safeDestroyPlayer(player);
          await interaction.deferUpdate();
        } catch (error) {
          await interaction.deferUpdate();
        }
        break;

      case "previous":
        const history = player.data?.get("history") || [];

        if (history.length === 0) {
          const display = new TextDisplayBuilder()
            .setContent(`**${client.emoji.info} No previous track found in history.**`);
          const container = new ContainerBuilder()
            .addTextDisplayComponents(display);
          return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
          });
        }

        const lastHistoryTrack = history[history.length - 1];

        try {
          const result = await client.manager.search(lastHistoryTrack.uri, {
            requester: interaction.user
          });

          if (result && result.tracks && result.tracks.length > 0) {
            player.queue.unshift(result.tracks[0]);
            history.pop();
            player.data?.set("history", history);
            await player.skip();
          }
        } catch (error) {
          console.error("Error loading previous track:", error);
        }

        await interaction.deferUpdate();
        break;

      case "like":
        const currentLikeTrack = player.queue?.current;
        if (!currentLikeTrack) {
          return interaction.deferUpdate();
        }

        try {
          const songs = client.db.liked.get(interaction.user.id);
          const alreadyLiked = songs.some(song => song.url === (currentLikeTrack.uri || currentLikeTrack.url));

          if (alreadyLiked) {
            const display = new TextDisplayBuilder()
              .setContent(`**${client.emoji.info} \`${currentLikeTrack.title}\` is already in your favourite list.**`);
            const container = new ContainerBuilder()
              .addTextDisplayComponents(display);
            return interaction.reply({
              components: [container],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });
          } else {
            songs.push({
              title: currentLikeTrack.title,
              url: currentLikeTrack.uri || currentLikeTrack.url,
              duration: currentLikeTrack.length || currentLikeTrack.duration,
              thumbnail: currentLikeTrack.thumbnail || currentLikeTrack.artworkUrl || currentLikeTrack.image,
              author: currentLikeTrack.author,
              addedAt: new Date().toISOString()
            });

            client.db.liked.set(interaction.user.id, songs);

            const display = new TextDisplayBuilder()
              .setContent(`**${client.emoji.check} Added \`${currentLikeTrack.title}\` to your favourite list.**`);
            const container = new ContainerBuilder()
              .addTextDisplayComponents(display);
            return interaction.reply({
              components: [container],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
            });
          }
        } catch (dbError) {
          console.error('[Like Button] Error:', dbError);
          const display = new TextDisplayBuilder()
            .setContent(`**${client.emoji.cross} Failed to save song to favorites. Please try again.**`);
          const container = new ContainerBuilder()
            .addTextDisplayComponents(display);
          return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
          }).catch(() => { });
        }

        break;

      default:
        const unknownDisplay = new TextDisplayBuilder()
          .setContent(`**${client.emoji.cross} Unknown button interaction.**`);

        const unknownContainer = new ContainerBuilder()
          .addTextDisplayComponents(unknownDisplay);

        await interaction.editReply({
          components: [unknownContainer],
          flags: MessageFlags.IsComponentsV2
        });
        break;
    }
  } catch (error) {
    const display = new TextDisplayBuilder()
      .setContent(`**${client.emoji.cross} An error occurred while processing your request.**`);
    const container = new ContainerBuilder()
      .addTextDisplayComponents(display);
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
      } catch (replyError) {
      }
    } else {
      try {
        await interaction.editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        });
      } catch (editError) {
      }
    }
  }
}

function setupMessageCollector(client, player, message) {
  try {
    const track = player.queue?.current;
    const collector = message.createMessageComponentCollector({
      time: Math.min(track?.length || track?.duration || 600000, 900000),
      componentType: ComponentType.Button,
    });

    collector.on("collect", async (interaction) => {
      try {
        if (!interaction.member?.voice?.channelId || interaction.member.voice.channelId !== player.voiceId) {
          const display = new TextDisplayBuilder()
            .setContent(`**${client.emoji.warn} You must be in the same voice channel as the bot.**`);
          const container = new ContainerBuilder()
            .addTextDisplayComponents(display);
          return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
          });
        }

        await handleButtonInteraction(interaction, player, client);

      } catch (interactionError) {
        if (!interaction.replied && !interaction.deferred) {
          const display = new TextDisplayBuilder()
            .setContent(`**${client.emoji.cross} An error occurred while processing your request.**`);
          const container = new ContainerBuilder()
            .addTextDisplayComponents(display);
          await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
          }).catch(() => { });
        }
      }
    });

    collector.on("end", (collected, reason) => {
    });

  } catch (error) {
  }
}

async function updateVoiceStatus(client, player, track) {
  try {
    if (!player.voiceId) {
      return;
    }

    if (player.state === 'DESTROYED' || player.state === 'DISCONNECTED') {
      return;
    }

    await client.rest
      .put(`/channels/${player.voiceId}/voice-status`, {
        body: { status: `${client.emoji.dance} Playing **${track.title}**` },
      })
      .catch((err) => {
        console.error('[VoiceStatus] Failed to update:', err.message || err);
      });
  } catch (error) {
    console.error('[VoiceStatus] Exception:', error.message || error);
  }
}

module.exports = {
  name: "playerStart",
  run: async (client, player, track) => {
    try {
      const guild = client.guilds.cache.get(player.guildId);
      if (!guild) {
        return;
      }

      if (!player.data?.get("playerStarted")) {
        player.data?.set("playerStarted", true);

        if (player_create) {
          const webhook = new WebhookClient({ url: player_create });

          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setAuthor({
              name: `Player Started`,
              iconURL: client.user.displayAvatarURL()
            })
            .setDescription(`**Server:** \`${guild.name}\`\n**ID:** \`${player.guildId}\``);

          webhook.send({ embeds: [embed] }).catch(() => { });
        }
      }

      const currentTrack = track || player.queue?.current;

      if (currentTrack) {
        await handleTrackStart(client, player, currentTrack);
      }

    } catch (error) {
    }
  },
};

async function handleTrackStart(client, player, track) {
  try {
    if (!track) {
      return;
    }

    player.data?.delete("playerEmptyProcessed");

    const oldMessage = player.data?.get("message");
    if (oldMessage) {
      oldMessage.delete().catch(() => { });
    }

    if (client.voiceHealthMonitor) {
      client.voiceHealthMonitor.updateActivity(player.guildId);
    }

    await updateVoiceStatus(client, player, track);

    const message = await sendNowPlaying(client, player, track);

    if (!message) {
      return;
    }

    player.data?.set("message", message);

    setupMessageCollector(client, player, message);

  } catch (error) {
    console.error('[HandleTrackStart] Error:', error);
  }
}
module.exports.updateNowPlayingButtons = updateNowPlayingButtons;

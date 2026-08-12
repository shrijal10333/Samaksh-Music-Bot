require('dotenv').config();
const path = require('path');
const fs = require('fs');

const localConfig = path.join(__dirname, 'config.local.json');
const jsonConfig = path.join(__dirname, 'config.json');

let config = {};

if (fs.existsSync(localConfig)) {
  try {
    config = require(localConfig);
  } catch (e) {
    console.warn("⚠️ Error reading config.local.json:", e.message);
  }
} else if (fs.existsSync(jsonConfig)) {
  try {
    config = require(jsonConfig);
  } catch (e) {
    console.warn("⚠️ Error reading config.json:", e.message);
  }
}

// Environment Variable Overrides & Fallbacks
config.token = process.env.TOKEN || process.env.DISCORD_TOKEN || config.token || "";
config.prefix = process.env.PREFIX || config.prefix || ".";

if (process.env.OWNER_ID || process.env.OWNERS) {
  const ownersStr = process.env.OWNER_ID || process.env.OWNERS;
  config.ownerID = ownersStr.includes(',') ? ownersStr.split(',').map(s => s.trim()) : [ownersStr.trim()];
} else if (!config.ownerID) {
  config.ownerID = [];
}

config.SpotifyID = process.env.SPOTIFY_ID || config.SpotifyID || "";
config.SpotifySecret = process.env.SPOTIFY_SECRET || config.SpotifySecret || "";
config.LastFmKey = process.env.LASTFM_KEY || config.LastFmKey || "";
config.LastFmSecret = process.env.LASTFM_SECRET || config.LastFmSecret || "";
config.color = process.env.COLOR || process.env.EMBED_COLOR || config.color || "#00D4FF";
config.logs = process.env.LOGS_CHANNEL_ID || config.logs || "";
config.node_source = process.env.NODE_SOURCE || config.node_source || "spsearch";

if (!config.links) {
  config.links = {
    support: process.env.SUPPORT_SERVER || "https://discord.gg/u98eRQRQQZ",
    invite: process.env.BOT_INVITE || "https://discord.gg/u98eRQRQQZ",
    guild: process.env.GUILD_LINK || "https://discord.gg/u98eRQRQQZ"
  };
}

if (!config.Webhooks) {
  config.Webhooks = {
    black: process.env.WEBHOOK_BLACK || "",
    player_create: process.env.WEBHOOK_PLAYER_CREATE || "",
    player_delete: process.env.WEBHOOK_PLAYER_DELETE || "",
    guild_join: process.env.WEBHOOK_GUILD_JOIN || "",
    guild_leave: process.env.WEBHOOK_GUILD_LEAVE || "",
    cmdrun: process.env.WEBHOOK_CMDRUN || ""
  };
}

if (process.env.LAVALINK_HOST || process.env.LAVALINK_URL) {
  const host = process.env.LAVALINK_HOST || process.env.LAVALINK_URL;
  const name = process.env.LAVALINK_NAME || "Groove";
  const auth = process.env.LAVALINK_AUTH || "youshallnotpass";
  const secure = process.env.LAVALINK_SECURE === "true" || host.includes(":443") || host.startsWith("https://");
  
  config.nodes = [{
    name,
    url: host,
    auth,
    secure
  }];
}

if (!config.nodes || !Array.isArray(config.nodes)) {
  config.nodes = [
    {
      name: "Groove",
      url: "lavalinkv4.serenetia.com:443",
      auth: "https://seretia.link/discord",
      secure: true
    }
  ];
}

if (!config.node_options) {
  config.node_options = {
    moveOnDisconnect: true,
    resume: true,
    resumeTimeout: 60,
    resumeByLibrary: true,
    reconnectTries: 15,
    reconnectInterval: 10,
    restTimeout: 60000,
    voiceConnectionTimeout: 30000,
    userAgent: "Groove"
  };
}

function parseBoolean(value) {
  if (typeof value === "string") {
    value = value.trim().toLowerCase();
  }
  switch (value) {
    case true:
    case "true":
      return true;
    default:
      return false;
  }
}

config.parseBoolean = parseBoolean;

module.exports = config;


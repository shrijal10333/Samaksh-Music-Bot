require('dotenv').config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");


const { setGlobalDispatcher, Agent } = require("undici");
setGlobalDispatcher(new Agent({
  connect: { timeout: 60_000 },
  headersTimeout: 60_000,
  bodyTimeout: 60_000,
  pipelining: 1
}));

const { Collection } = require("discord.js");
const MusicBot = require("./src/structures/MusicClient");
const initializeCleanup = require("./src/events/Client/PremiumChecks");
const Dokdo = require("dokdo");
const config = require("./src/config");
const http = require("http");

const client = new MusicBot();
module.exports = client;

// HTTP keep-alive server for web pings / health checks
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/ping' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      bot: client.user ? client.user.tag : 'Connecting...',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`[Web Server] HTTP health-check server running on port ${PORT}`);
  }).on('error', (err) => {
    console.log(`[Web Server] Port ${PORT} already in use or unavailable: ${err.message}`);
  });
}

if (!client.ws || !client.ws.status) {
  client.connect().catch(err => {
    console.error("[MusicBot] Login error:", err.message);
  });
}



client.Jsk = new Dokdo.Client(client, {
  aliases: ["dokdo", "dok", "jsk"],
  prefix: [''],
  owners: client.owners,
});

process.env.SHELL = process.platform === "win32" ? "powershell" : "bash";


const emojis = require("./src/emojis");
client.emoji = emojis;

client.on("messageCreate", (message) => {
  client.Jsk.run(message);
});

process.on("unhandledRejection", (reason, p) => {
  if (reason && (reason.code === 'UND_ERR_CONNECT_TIMEOUT' || (reason.message && reason.message.includes('fetch failed')))) {
    console.log("[Lavalink Error] Connection timeout or fetch failed. Node might be down.");
    return;
  }

  console.log("[Unhandled Rejection]", reason, p);

  if (reason && reason.message && reason.message.includes('Session not found')) {
    console.log("[Session Error] Lavalink session lost, attempting cleanup...");

    if (reason.path && typeof reason.path === 'string') {
      const guildIdMatch = reason.path.match(/\/players\/(\d+)/);
      if (guildIdMatch && guildIdMatch[1]) {
        const guildId = guildIdMatch[1];
        console.log(`[Session Error] Cleaning up player for guild ${guildId}`);

        try {
          if (client.manager && client.manager.players.has(guildId)) {
            client.manager.players.delete(guildId);
          }

          if (client.voiceHealthMonitor) {
            client.voiceHealthMonitor.stopMonitoring(guildId);
          }
        } catch (cleanupError) {
          console.error("[Session Error] Cleanup failed:", cleanupError);
        }
      }
    }
  }
});

process.on("uncaughtException", (err, origin) => {
  console.log("[Uncaught Exception]", err, origin);
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log("[Uncaught Exception Monitor]", err, origin);
});

initializeCleanup(client);

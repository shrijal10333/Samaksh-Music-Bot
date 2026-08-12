require('dotenv').config();
const config = require("./src/config");
const { ClusterManager } = require("discord-hybrid-sharding");

const manager = new ClusterManager("./index.js", {
  totalShards: "auto",
  shardsPerCluster: 1,
  mode: "process",
  token: config.token,
  respawn: true,
  restarts: {
    max: 5,
    interval: 1000,
  },
  execArgv: ["--no-warnings"],
});

manager.on("clusterCreate", (cluster) => {
  console.log(`[ShardManager] Launched cluster ${cluster.id}`);
});

manager.spawn({ timeout: -1 });

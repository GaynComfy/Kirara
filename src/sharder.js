const isDev = process.env.NODE_ENV === "development";
const config = isDev ? require("./config-dev") : require("./config-prod");
const { ShardingManager } = require("discord.js");

const shardManager = new ShardingManager("./src/index.js", {
  totalShards: config.shardCount || 2,
  token: process.env.TOKEN,
  respawn: true,
});

shardManager.on("shardCreate", (shard) => {
  console.log("Shard spwned");
});

shardManager.spawn();

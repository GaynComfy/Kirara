const isDev = process.env.NODE_ENV === "development";
const config = isDev ? require("./config-dev") : require("./config-prod");
const { ShardingManager } = require("discord.js");

const shardManager = new ShardingManager("./src/index.js", {
  totalShards: config.shardCount || 2,
  token: process.env.TOKEN,
  respawn: true,
});
let count = 0;
shardManager.on("shardCreate", (shard) => {
  count++;
  console.log("Shard spawned");
  if (count === (config.shardCount || 2)) {
    console.log("All shards live!");
  }
});

shardManager.spawn();

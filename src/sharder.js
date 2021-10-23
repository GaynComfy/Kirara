require("dotenv").config();

const isDev = process.env.NODE_ENV === "development";
const config = isDev ? require("../config-dev") : require("../config-prod");

const { ShardingManager } = require("discord.js");
const { ShardingClient } = require("statcord.js");

const shardManager = new ShardingManager("./src/index.js", {
  totalShards: config.shardCount || 2,
  token: process.env.TOKEN,
  respawn: true,
});

let statcord;
if (process.env.STATCORD_TOKEN) {
  statcord = new ShardingClient({
    key: process.env.STATCORD_TOKEN,
    manager: shardManager,
  });

  statcord.on("post", status => {
    if (!status) console.log("Posted to Statcord successfully");
    else console.error("Error posting to Statcord", status);
  });
} else {
  console.debug("! opted out from statcord reporting");
}

let count = 0;
shardManager.on("shardCreate", shard => {
  count++;
  console.log(`Shard ${shard.id} spawned`);
  if (count === (config.shardCount || 2)) {
    console.log("All shards live!");
  }
});

shardManager.spawn();

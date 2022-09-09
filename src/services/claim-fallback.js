// This processes claims as we get them based on Shoob's sent embeds.
// This will work in case an API request gets lost, midori is down,
// or they break the bot as they did in the Shoob 2 rewrite.
const Redis = require("ioredis");

let client = null;
let updateInterval = null;

const saveSpawn = async (instance, data) => {
  const serverId = instance.serverIds[data.server_id];
  if (!serverId) {
    console.error(
      "DID WE JUST TRY TO HANDLE A CLAIM FROM A SERVER WE DON'T KNOW?"
    );
    return;
  }

  try {
    await instance.database.simpleInsert("CARD_CLAIMS", {
      claimed: data.claimed,
      server_id: serverId,
      discord_id: data.discord_id,
      channel_id: data.channel_id,
      message_id: data.message_id,
      card_id: data.card_id,
      card_name: data.card_name,
      image_url: data.image_url,
      issue: data.issue,
      tier: data.tier,
      from_clyde: data.from_clyde,
      time: data.time,
      season: instance.config.season,
    });
  } catch (e) {
    if (e.code === "23505") {
      // duplicate
      return;
    }
    throw e;
  }
  if (data.claimed) {
    await instance.database.pool.query(
      "UPDATE SERVERS SET claims = claims + 1, spawns = spawns +1 WHERE id=$1",
      [serverId]
    );
  } else {
    await instance.database.pool.query(
      "UPDATE SERVERS SET spawns = spawns + 1 WHERE id=$1",
      [serverId]
    );
  }

  await client.publish("claims", JSON.stringify(data));

  if (process.env.NODE_ENV !== "production") {
    if (data.claimed) {
      console.debug(
        `[${instance.client.shard.ids[0]}] <@!${data.discord_id}> claimed T${data.tier} ${data.card_name} V${data.issue} on <#${data.channel_id}>`
      );
    } else if (data.despawn) {
      console.debug(
        `[${instance.client.shard.ids[0]}] T${data.tier} ${data.card_name} despawned on <#${data.channel_id}>`
      );
    } else {
      console.error(
        `[${instance.client.shard.ids[0]}] T${data.tier} ${data.card_name} [${data.message_id}] got lost in time on <#${data.channel_id}>... (despawned)`
      );
    }
  }

  instance.kClaims++;
};

module.exports = {
  start: async instance => {
    if (updateInterval !== null || client !== null) return;
    if (!instance.shared["spawn"]) instance.shared["spawn"] = {};

    // Redis client (yes, we submit claims so the same bot handles it...
    // very efficient I know. but to be fair, it's the best to balance it.)
    const { config } = instance;
    client = new Redis(`redis://${config.cache.host}:${config.cache.port}`);

    const spawns = instance.shared["spawn"];

    // Handler for claims updater
    updateInterval = setInterval(async () => {
      for (const chan of Object.keys(spawns)) {
        const chn = spawns[chan];
        for (const spawn of chn) {
          if (
            ((spawn.claimed === true || spawn.despawn === true) &&
              Date.now() - spawn.time >= 5000) ||
            Date.now() - spawn.time >= 30000
          ) {
            // a card was claimed/despawned, and we've not received an event from Anime Soul - so save it.
            await saveSpawn(instance, spawn)
              .then(() => {
                const i = chn.indexOf(spawn);
                if (i !== -1) chn.splice(i, 1);
              })
              .catch(err => console.error(err));
          }
        }
      }
    }, 1000);
  },
  stop: async () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
    if (client !== null) {
      client.end(true);
      client = null;
    }
  },
};

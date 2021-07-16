// Tracks spawns as they happen lively on Shoob.
const { tierInfo } = require("../utils/cardUtils");
const { cardId } = require("../utils/regexUtils");
const CardFetcher = require("../utils/CardFetcher");

const hasClaimed = /<@!?(\d{17,19})> got the `(.*)` Issue #: `(\d{1,6})`./;
const hasDespawned = "Looks like nobody got the dropped card this time.";

const processSpawn = async (instance, message, embed) => {
  if (!instance.shared["spawn"][message.channel.id])
    instance.shared["spawn"][message.channel.id] = [];

  const name = embed.title.split(" Tier: ")[0];
  const card_id = cardId.exec(embed.url)[2];
  const tieri = Object.values(tierInfo).find(t => t.color === embed.hexColor);
  let tier = "";
  if (tieri) tier = tieri.num.toString();
  else {
    try {
      tier = (await CardFetcher.fetchById(instance, cardId, false)).tier;
    } catch {}
  }

  instance.shared["spawn"][message.channel.id].push({
    claimed: false,
    issue: -1,
    discord_id: "",
    card_name: name,
    from_clyde: false,
    card_id,
    server_name: message.guild.name,
    server_id: message.guild.id,
    channel_id: message.channel.id,
    message_id: message.id,
    tier,
    image_url: `https://animesoul.com/api/cardr/${card_id}`,
    time: new Date(),
    kirara: true,
    despawn: false,
    deleted: false,
  });

  console.debug(
    `[${instance.client.shard.ids[0]}] Shoob spawned T${tier} ${name} on <#${message.channel.id}> [${message.id}]`
  );
};
const processClaim = async (instance, message, embed) => {
  if (!instance.shared["spawn"][message.channel.id]) return;
  const chanSpawns = instance.shared["spawn"][message.channel.id];

  const claim = hasClaimed.exec(embed.description);
  if (!claim) return; // how we did even get here???

  const spawn = chanSpawns.find(s => s.card_name === claim[2]);
  if (!spawn) {
    return console.error(
      `[${instance.client.shard.ids[0]}] Got an unknown claim for ${claim[2]} V${claim[3]} from <@!${claim[1]}>`
    );
  }

  const i = chanSpawns.indexOf(spawn);
  if (i === -1) return;

  chanSpawns[i] = {
    ...chanSpawns[i],
    claimed: true,
    issue: parseInt(claim[3]),
    discord_id: claim[1],
    time: new Date(),
  };

  console.debug(
    `[${instance.client.shard.ids[0]}] <@!${claim[1]}> claimed T${chanSpawns[i].tier} ${spawn.card_name} V${claim[3]} on <#${message.channel.id}>`
  );
};
const processDespawn = async (instance, message) => {
  if (!instance.shared["spawn"][message.channel.id]) return;
  if (!instance.shared["spawnDelete"][message.channel.id])
    instance.shared["spawnDelete"][message.channel.id] = [];

  const spawns = instance.shared["spawn"][message.channel.id];

  const delSpawns = instance.shared["spawn"][message.channel.id].filter(
    s => s.deleted === true && new Date() - s.time >= 15000
  );
  if (delSpawns.length > 0) {
    // let's suppose we're dealing with a deleted spawn here
    const i = spawns.indexOf(delSpawns[0]);
    if (i === -1) return; // oh fuck

    const s = instance.shared["spawn"][message.channel.id][i];
    s.despawn = true;
    s.deleted = false;
    s.time = new Date();
    console.debug(
      `[${instance.client.shard.ids[0]}] T${s.tier} ${s.card_name} (deleted spawn) despawned on <#${s.channel_id}>`
    );
  } else {
    instance.shared["spawnDelete"][message.channel.id].push(new Date());

    console.debug(
      `[${instance.client.shard.ids[0]}] A card just despawned on <#${message.channel.id}>`
    );
  }
};

module.exports = {
  execute: async (instance, message) => {
    if (
      message.author.id !== "673362753489993749" &&
      message.author.id !== instance.client.user.id
    ) {
      return;
    }
    for (const embed of message.embeds) {
      if (embed.title && (embed.description || "").startsWith("To claim, ")) {
        await processSpawn(instance, message, embed);
      } else if (!embed.title && hasClaimed.test(embed.description)) {
        await processClaim(instance, message, embed);
      } else if ((embed.description || "") === hasDespawned) {
        await processDespawn(instance, message);
      }
    }
  },
  eventName: "message",
};

// Tracks spawns as they happen lively on Shoob.
const { tierInfo } = require("../utils/cardUtils");
const { cardId } = require("../utils/regexUtils");
const CardFetcher = require("../utils/CardFetcher");

const hasClaimed = /<@!?(\d{17,19})> got the `(.*)` Issue #: `(\d{1,6})`./;

const tiers = Object.values(tierInfo);

const processSpawn = async (instance, message, embed) => {
  if (!instance.shared["spawn"][message.channel.id])
    instance.shared["spawn"][message.channel.id] = [];

  const name = embed.title.split(" Tier: ")[0];
  const card_id = cardId.exec(embed.url)[2];
  const tieri = tiers.find(t => t.color === embed.hexColor);
  let tier = "";
  if (tieri) tier = tieri.num.toString();
  else {
    try {
      tier = (await CardFetcher.fetchById(instance, card_id, false)).tier;
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
  });

  if (process.env.NODE_ENV !== "production") {
    console.debug(
      `[${instance.client.shard.ids[0]}] Shoob spawned T${tier} ${name} on <#${message.channel.id}> [${message.id}]`
    );
  }
};
const processClaim = async (instance, message, embed) => {
  if (!instance.shared["spawn"][message.channel.id]) return;
  const chanSpawns = instance.shared["spawn"][message.channel.id];

  const claim = hasClaimed.exec(embed.description);
  if (!claim) return; // how we did even get here???

  const spawn = chanSpawns.find(s => s.card_name === claim[2]);
  if (!spawn) return;

  const newSpawn = {
    ...spawn,
    claimed: true,
    issue: parseInt(claim[3]),
    discord_id: claim[1],
    time: new Date(),
  };

  const i = chanSpawns.indexOf(spawn);
  if (i === -1) return;
  chanSpawns[i] = newSpawn;
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
      }
    }
  },
  eventName: "message",
};

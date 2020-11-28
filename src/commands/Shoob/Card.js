const Fetcher = require("../../utils/CardFetcher");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");
const { tierInfo } = require("../../utils/cardUtils");
const { map } = require("../../utils/GifFetcher");

const info = {
  name: "card",
  aliases: ["c"],
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6", "ts"];

module.exports = {
  execute: async (instance, message, args) => {
    if (args.length === 0) return false;
    const hasTier = allowed.includes(args[0].toLowerCase());
    if (hasTier && args.length === 1) return false;
    const tier = hasTier ? args.shift()[1].replace("s", "S") : "all";
    const name = args.join(" ");
    const card = await Fetcher.fetchByName(instance, name, tier);
    if (card === null) {
      const embedz = new MessageEmbed()
        .setDescription(
          `<a:Sirona_Tick:749202570341384202> no card found for that criteria, try another search`
        )
        .setColor("RANDOM");
      message.channel.send({ embed: embedz });
      return null;
    }
    const selectedColor = tierInfo[`T${card.tier}`];

    const query =
      "SELECT COUNT(id) c, CARD_CLAIMS.* FROM CARD_CLAIMS WHERE claimed=true AND card_id=$1 GROUP BY discord_id ORDER BY c DESC LIMIT 8";
    const { rows: entries } = await instance.database.pool.query(query, [
      card.id,
    ]);
    const claimers = [];
    const mapped = [];
    for (const claim of entries) {
      let result = await instance.client.shard.broadcastEval(
        `this.users.resolve('${claim.discord_id}')`
      );
      if (!result) {
        result = instance.client.users.resolve(claim.discord_id) || {
          username: "Unkown user",
        };
      }
      mapped.push({ value: result.username, count: claim.c });
      claimers.push(
        `> • \`Issue: ${claim.issue}\` | [__**${result.username}**__](https://animesoul.com/user/${claim.discord_id})`
      );
    }

    createPagedResults(message, 2, (page) => {
      if (page === 0) {
        return new MessageEmbed()
          .setTitle(
            `${selectedColor.emoji}  •  ${card.name}  •  ${
              card.tier === "S"
                ? "S"
                : Array(Number.parseInt(card.tier))
                    .fill()
                    .map(() => "★")
                    .join("")
            }`
          )
          .setColor(selectedColor.color)
          .setImage(card.image_url.replace(".webp", ".gif"))
          .setFooter("React to ▶️ for more info");
      } else {
        return new MessageEmbed()
          .setTitle(
            `${selectedColor.emoji}  •  ${card.name}  •  ${
              card.tier === "S"
                ? "S"
                : Array(Number.parseInt(card.tier))
                    .fill()
                    .map(() => "★")
                    .join("")
            }`
          )
          .setURL(`https://animesoul.com/cards/info/${card.id}`)
          .setDescription(
            `\`Tier: ${card.tier}\` \`Batch: ${"-"}\`\n\`Highest Issue: ${
              card.claim_count
            }\`\n\`Source: ${card.series[0] || "-"}\``
          )
          .setThumbnail(card.link)
          .setImage(
            "https://cdn.discordapp.com/attachments/755444853084651572/769403818600300594/GACGIF.gif"
          )
          .addField(
            "Top Claimers:",
            mapped
              .slice(0, 3)
              .map((user) => `\`${user.value} (${user.count}x)\``)
              .join(" | ") || "-"
          )
          .addField(
            "__Card Owners:__",
            claimers.length === 0 ? "-" : claimers,
            true
          )
          .setFooter("React to ◀️ get back")
          .setColor(selectedColor.color);
      }
    });
    return true;
  },
  info,
  help: {
    usage: "card <tier> <name>",
    examples: ["card t6 alice"],
    description: "Fetch a card by tier & name",
  },
};

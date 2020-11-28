const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
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
    const isGlobal = (args[0].toLowerCase() === 'global' || args[0].toLowerCase() === 'g');
    if (isGlobal) args.splice(0, 1);
    const hasTier = allowed.includes(args[0].toLowerCase());
    if (hasTier && args.length === 1) return false;
    const tier = hasTier ? args.shift()[1].toUpperCase() : "all";
    const name = args.join(" ");
    const card = await Fetcher.fetchByName(instance, name, tier);
    if (card === null) {
      const embedz = new MessageEmbed()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> No card found for that criteria.`
        )
        .setColor(Color.red);
      message.channel.send({ embed: embedz });
      return null;
    }
    const selectedColor = tierInfo[`T${card.tier}`];

    const claimers = [];
    const mapped = [];
    if (isGlobal) {
      const entries = await Fetcher.fetchOwners(instance, card.id, '8');
      const mapTemp = {};
      for (const claim of entries) {
        const owners = claim.trade_history;
        const username = owners[owners.length - 1].username;
        mapTemp[username]++;
        claimers.push(
          `> • \`Issue: ${claim.issue}\` | [__**${username}**__](https://animesoul.com/user/${claim.discord_id})`
        );
      }
      // if limited, it will just show the top claimers of the first 8 issues
      for (const user of mapTemp) {
        mapped.push({ value: user, count: mapTemp[user] });
      }
    } else {
      const query =
        "SELECT aggregate.c, CARD_CLAIMS.discord_id, CARD_CLAIMS.issue, CARD_CLAIMS.id " +
        "as extern_id FROM (SELECT id, COUNT(id) AS c FROM CARD_CLAIMS WHERE claimed=true " +
        "AND card_id=$1 GROUP BY discord_id,id ORDER BY c DESC LIMIT 8) as aggregate " +
        "JOIN CARD_CLAIMS ON CARD_CLAIMS.id=aggregate.id";
      const { rows: entries } = await instance.database.pool.query(query, [
        card.id,
      ]);
      for (const claim of entries) {
        let result = await instance.client.users.fetch(claim.discord_id);
        if (!result) {
          result = {
            username: "Unknown user",
          };
        }
        mapped.push({ value: result.username, count: claim.c });
        claimers.push(
          `> • \`Issue: ${claim.issue}\` | [__**${result.username}**__](https://animesoul.com/user/${claim.discord_id})`
        );
      }
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
            `\`Tier: ${card.tier}\`\n\`Highest Issue: ${
              card.claim_count
            }\`\n\`Source: ${card.series[0] || "-"}\``
          )
          .setThumbnail(card.image_url.replace(".webp", ".gif"))
          .setImage(
            "https://cdn.discordapp.com/attachments/755444853084651572/769403818600300594/GACGIF.gif"
          )
          .addField(
            `Top ${isGlobal ? 'Global ' : ''}Claimers:`,
            mapped
              .slice(0, 3)
              .map((user) => `\`${user.value} (${user.count}x)\``)
              .join(" | ") || "- No one! <:shoob:760021745905696808>"
          )
          .addField(
            `__${isGlobal ? 'Global ' : ''}Card Owners:__`,
            claimers.length === 0 ? "- No one! <:shoob:760021745905696808>" : claimers,
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
    usage: "card [global] <tier> <name>",
    examples: ["card global t6 Alice", "card t6 Rin"],
    description: "Fetch a card by tier & name",
  },
};

const moment = require("moment");
const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");
const { tierInfo } = require("../../utils/cardUtils");

const info = {
  name: "card",
  aliases: ["c"],
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6", "ts"];

const cardId = /^(https?:\/\/animesoul\.com\/cards\/info\/)?([a-z0-9]{24})$/;
const space = / /; // lol

module.exports = {
  execute: async (instance, message, args) => {
    if (args.length === 0) return false;
    const isEvent =
      args[0].toLowerCase() === "event" || args[0].toLowerCase() === "e";
    const isGlobal =
      isEvent ||
      args[0].toLowerCase() === "servers" ||
      args[0].toLowerCase() === "bot" ||
      args[0].toLowerCase() === "s";
    const isOldGlobal =
      isEvent ||
      args[0].toLowerCase() === "global" ||
      args[0].toLowerCase() === "g";
    if (isEvent || isGlobal || isOldGlobal) args.shift();
    if (args.length === 0) return false;
    const hasTier = allowed.includes(args[0].toLowerCase());
    const hasCardId = cardId.test(args[0]);
    if (hasTier && args.length === 1) return false;
    message.channel.startTyping();
    const tier = hasTier ? args.shift()[1].toUpperCase() : "all";
    const card_id = hasCardId ? cardId.exec(args.shift())[2] : null;
    let card = null;
    if (card_id) {
      card =
        (await Fetcher.fetchById(instance, card_id, isEvent)) ||
        (!isEvent
          ? await Fetcher.fetchById(instance, card_id, !isEvent)
          : null);
    } else {
      const name = args.join(" ");
      card =
        (await Fetcher.fetchByName(instance, name, tier, isEvent)) ||
        (space.test(name)
          ? await Fetcher.fetchByName(
              instance,
              [...args.slice(-1), ...args.slice(0, -1)].join(" "),
              tier,
              isEvent
            )
          : null);
    }
    if (card === null) {
      message.channel.stopTyping();
      const embedz = new MessageEmbed()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> No card found for that criteria.`
        )
        .setColor(Color.red);
      message.channel.send({ embed: embedz });
      return null;
    }
    const tierSettings = tierInfo[`T${card.tier}`];
    let claimersAmount = 0;
    const claimers = [];
    const mapped = [];
    if (isGlobal) {
      // Bot-tracked card search
      const query =
        "SELECT COUNT (id) c, issue, discord_id FROM card_claims WHERE claimed=true " +
        "AND card_id=$1 GROUP BY discord_id,issue ORDER BY issue ASC LIMIT 100";
      const { rows: entries } = await instance.database.pool.query(query, [
        card.id,
      ]);
      claimersAmount = entries.length;
      for (const claim of entries) {
        let result = await instance.client.users.fetch(claim.discord_id);
        if (!result) {
          result = {
            username: "Unknown user",
          };
        }
        mapped.push({
          discord_id: claim.discord_id,
          username: result.username,
          count: claim.c,
        });
        claimers.push(
          `> • \`Issue: ${claim.issue}\` | [__**${result.username}**__](https://animesoul.com/user/${claim.discord_id})`
        );
      }
    } else {
      // AS card search
      const entries = await Fetcher.fetchCardCount(instance, card.id);
      claimersAmount = entries;
    }

    message.channel.stopTyping();

    const pages = Math.ceil(claimersAmount / 10);
    createPagedResults(message, 2 + (pages > 0 ? pages : 1), async (page) => {
      if (page === 0) {
        return new MessageEmbed()
          .setTitle(
            `${tierSettings.emoji}  •  ${card.name}  •  ${
              card.tier === "S"
                ? "S"
                : Array(Number.parseInt(card.tier))
                    .fill()
                    .map(() => "★")
                    .join("")
            }`
          )
          .setURL(`https://animesoul.com/cards/info/${card.id}`)
          .setColor(tierSettings.color)
          .setImage(encodeURI(card.image_url).replace(".webp", ".gif"))
          .setFooter("React ▶️ for more info");
      } else if (page === 1) {
        const listings = await Fetcher.fetchMarketByCardId(
          instance,
          card.id,
          "0",
          "10"
        );
        const market = listings.map(
          (listing) =>
            `> [• \`Issue: ${listing.item.issue}\`](https://animesoul.com/market) | ` +
            `Price: \`富 ${listing.price}\` | ` +
            `Added: \`${moment(listing.date_added * 1000).fromNow()}\``
        );
        let topOwners = mapped.map(
          (user) =>
            `> • \`${user.count}x ${user.count > 1 ? "issues" : "issue"}\` | ` +
            `[__**${user.username}**__](https://animesoul.com/user/${user.discord_id})`
        );
        const makers = card.creators
          .filter((c) => c.type === "maker")
          .map((maker) => `[${maker.name}](${maker.link})`);
        const artists = card.creators
          .filter((c) => c.type === "artist")
          .map((artist) => `[${artist.name}](${artist.link})`);

        if (!isGlobal) {
          const top = await Fetcher.fetchTopOwners(instance, card.id, "0", "5");
          topOwners = top.map(
            (user) =>
              `> • \`${user.count}x ${
                user.count > 1 ? "issues" : "issue"
              }\` | ` +
              `[__**${user.username}**__](https://animesoul.com/user/${user.discord_id})`
          );
        }

        const embed = new MessageEmbed()
          .setTitle(
            `${tierSettings.emoji}  •  ${card.name}  •  ${
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
            }\`\n\`Source: ${card.series[0] || "-"}\`` +
              (makers.length !== 0
                ? `\nCard ${
                    makers.length === 1 ? "Maker" : "Makers"
                  }: ${makers.join(", ")}`
                : "") +
              (artists.length !== 0
                ? `\n${
                    artists.length === 1 ? "Artist" : "Artists"
                  }: ${artists.join(", ")}`
                : "")
          )
          .setThumbnail(encodeURI(card.image_url).replace(".webp", ".gif"))
          .setImage(
            card.ability
              ? card.ability_gif
              : "https://cdn.discordapp.com/attachments/755444853084651572/769403818600300594/GACGIF.gif"
          )
          .setFooter("React ▶️ for card owners")
          .setColor(tierSettings.color);
        if (card.ability) {
          embed.addField(`**${card.ability_name}**`, card.ability_description);
        }
        embed
          .addField(
            "__Top Owners:__",
            topOwners.length === 0
              ? "- No one <:SShoob:783636544720207903>"
              : topOwners
          )
          .addField(
            "__Market Listings:__",
            market.length === 0 ? "- None <:SShoob:783636544720207903>" : market
          );
        return embed;
      } else {
        const pnum = page - 2;
        if ((pages === 0 && pnum > 0) || (pages !== 0 && pnum >= pages))
          return null;

        const offset = pnum * 10;
        let owners = [];
        if (isGlobal) {
          // changing this to database querying in a sec
          owners = claimers.slice(offset, offset + 10);
        } else {
          const entries = await Fetcher.fetchOwners(
            instance,
            card.id,
            offset,
            "10"
          );
          for (const claim of entries) {
            const tradeHistory = claim.trade_history;
            const username = tradeHistory[tradeHistory.length - 1].username;
            owners.push(
              `> • \`Issue: ${claim.issue}\` | [__**${username}**__](https://animesoul.com/user/${claim.discord_id})`
            );
          }
        }

        return new MessageEmbed()
          .setTitle(
            `${tierSettings.emoji}  •  ${card.name}  •  ${
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
          .setThumbnail(encodeURI(card.image_url).replace(".webp", ".gif"))
          .setImage(
            "https://cdn.discordapp.com/attachments/755444853084651572/769403818600300594/GACGIF.gif"
          )
          .setFooter(
            (pages > 1 ? `Page: ${pnum + 1}/${pages} | ` : "") +
              (pnum + 1 < pages ? "React ▶️ for next page | " : "") +
              "React ◀️ to go back"
          )
          .setColor(tierSettings.color)
          .addField(
            `__${isGlobal ? "Stored Card Claims" : "Card Owners"}:__`,
            owners.length === 0
              ? "- No one <:SShoob:783636544720207903>"
              : owners
          );
      }
    });
    return true;
  },
  info,
  help: {
    usage: "card <[*e*vent/*s*ervers] [tier] <name>/[auction ID/link]>",
    examples: [
      "card servers t6 Alice",
      "card event t4 Rem",
      "card t6 Rin",
      "card Nezuko",
      "card https://animesoul.com/cards/info/5d7577216f818277a57e5698",
    ],
    description: "Fetch a card by tier & name",
  },
};

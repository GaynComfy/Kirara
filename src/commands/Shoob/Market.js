const moment = require("moment");
const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");
const { tierInfo } = require("../../utils/cardUtils");

const info = {
  name: "market",
  aliases: ["mk"],
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6", "ts"];
const allowedSortings = [
  "r",
  "recent",
  "pu",
  "pd",
  "priceup",
  "pricedown",
  "o",
  "oldest",
];
const space = / /; // lol

const sortListings = (arr, opt) => {
  if (opt === "r" || opt === "recent")
    return arr.sort((a, b) => b.date_added - a.date_added);

  if (opt === "o" || opt === "oldest")
    return arr.sort((a, b) => a.date_added - b.date_added);

  if (opt === "pu" || opt === "priceup")
    return arr.sort((a, b) => a.price - b.price);
  if (opt === "pd" || opt === "pricedown")
    return arr.sort((a, b) => b.price - a.price);

  return arr.sort((a, b) => a.item.issue - b.item.issue);
};

const processWithCard = async (instance, message, option, card) => {
  const selectedColor = tierInfo[`T${card.tier}`];
  const listings = await Fetcher.fetchMarketByCardId(
    instance,
    card.id,
    "0",
    "300"
  );
  const sorted = sortListings(listings, option);
  message.channel.stopTyping();
  if (sorted.length === 0) {
    const embed = new MessageEmbed()
      .setDescription(
        `<:Sirona_NoCross:762606114444935168> No active market listings for this card!`
      )
      .setColor(Color.red);
    message.channel.send({ embed });
    return null;
  }

  const pages = Math.ceil(listings.length / 10);
  createPagedResults(message, pages, async (page) => {
    const entries = sorted.slice(page * 10, page * 10 + 10);
    const market = entries.map(
      (listing) =>
        `> [• \`Issue: ${listing.item.issue}\`](https://animesoul.com/market) | ` +
        `Price: \`富 ${listing.price}\` | ` +
        `Added: \`${moment(listing.date_added * 1000).fromNow()}\``
    );

    const embed = new MessageEmbed()
      .setTitle(
        `${selectedColor.emoji}  •  Market: ${card.name}  •  ${
          card.tier === "S"
            ? "S"
            : Array(Number.parseInt(card.tier))
                .fill()
                .map(() => "★")
                .join("")
        }`
      )
      .setURL(`https://animesoul.com/cards/info/${card.id}`)
      .setThumbnail(encodeURI(card.image_url).replace(".webp", ".gif"))
      .setColor(selectedColor.color);

    if (pages > 1) {
      embed.setFooter(
        (pages > 1 ? `Page: ${page + 1}/${pages} | ` : "") +
          (page + 1 < pages ? "React ▶️ for next page | " : "") +
          "React ◀️ to go back"
      );
    }

    if (page === 0) {
      embed.setDescription(
        `\`Tier: ${card.tier}\`\n\`Lowest Market Issue: ${
          sorted[0].item.issue
        }\`\n\`Source: ${card.series[0] || "-"}\``
      );
    }
    embed.addField(
      `__Market Listings:__`,
      market.length === 0 ? "- None <:SShoob:783636544720207903>" : market
    );

    return embed;
  });
};

const processWithoutCard = async (instance, message, tier) => {
  let last = -1;

  createPagedResults(message, Infinity, async (page) => {
    if (page > last && last !== -1) return null;
    const offset = page * 6;
    const result = await Fetcher.fetchMarket(instance, offset, tier);
    if (result.length < 6 && last === -1) last = page;
    const isLast = last !== -1 && page === last;
    const tierSettings = tier !== "all" ? tierInfo[`T${tier}`] : null;

    const market = result.map(
      (listing, i) =>
        `> **${i + 1}.** \`T${
          listing.item.tier
        }\` • [\`${listing.item.name.substr(
          0,
          15
        )}\`](https://animesoul.com/cards/info/${listing.item.id}) | ` +
        `• \`V${listing.item.issue}\` | \`富 ${listing.price}\` | ` +
        ` \`${moment(listing.date_added * 1000).fromNow()}\``
    );

    const embed = new MessageEmbed()
      .setTitle(
        tierSettings
          ? `${tierSettings.emoji} Market: Most recent T${tier} entries`
          : "<:Flame:783439293506519101> Market: Most recent entries"
      )
      .setURL(`https://animesoul.com/market`)
      .setColor(tierSettings ? tierSettings.color : Color.default);

    if (last !== 0) {
      embed.setFooter(
        `Page: ${isLast ? "Last" : page + 1}` +
          (!isLast ? ` | React ▶️ for next page` : "") +
          (page > 0 ? " | React ◀️ to go back" : "")
      );
    }

    embed.addField(
      `__Market Listings:__`,
      market.length === 0 ? "- None <:SShoob:783636544720207903>" : market
    );

    return embed;
  });
  return true;
};

module.exports = {
  execute: async (instance, message, args) => {
    const isEvent =
      args.length > 0 &&
      (args[0].toLowerCase() === "event" || args[0].toLowerCase() === "e");
    if (isEvent) args.shift();
    const hasTier =
      args.length > 0 ? allowed.includes(args[0].toLowerCase()) : false;
    const tier = hasTier ? args.shift()[1].toUpperCase() : "all";
    if (args.length === 0)
      return await processWithoutCard(instance, message, tier);

    const hasOption =
      args.length > 0 ? allowedSortings.includes(args[0].toLowerCase()) : false;
    if (hasOption && args.length === 1) return false;
    const option = hasOption ? args.shift().toLowerCase() : null;
    const name = args.join(" ");
    message.channel.startTyping();
    const card =
      (await Fetcher.fetchByName(instance, name, tier, isEvent)) ||
      (space.test(name)
        ? await Fetcher.fetchByName(
            instance,
            [...args.slice(-1), ...args.slice(0, -1)].join(" "),
            tier,
            isEvent
          )
        : null);
    if (card === null) {
      message.channel.stopTyping();
      const embed = new MessageEmbed()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> No card found for that criteria.`
        )
        .setColor(Color.red);
      message.channel.send({ embed });
      return null;
    }
    await processWithCard(instance, message, option, card);
    return true;
  },
  info,
  help: {
    usage: "market [event] [tier] [option] [name]",
    examples: [
      "mk",
      "market t6 Alice",
      "market event t4 Rem",
      "market t6 Rin",
      "market Sora and Shiro",
    ],
    description:
      "Get Market entries for a card! Valid options: " +
      allowedSortings.join(","),
  },
};

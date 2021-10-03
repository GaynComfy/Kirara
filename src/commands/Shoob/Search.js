const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");
const { MessageEmbed } = require("discord.js");
const { tierInfo } = require("../../utils/cardUtils");
const { getCard } = require("./utils");
const { createMessagePagedResults } = require("../../utils/PagedResults");
const { cardId } = require("../../utils/regexUtils");

const EVENT = ["event", "e"];
const GLOBAL = ["servers", "bot", "s"];
const OLD_GLOBAL = ["global", "g"];

const info = {
  name: "search",
  aliases: ["s", "find", "f"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
  perms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
  usage: "search [event] [servers] [tier] <name/card ID/link>",
  examples: [
    "search servers t6 Alice",
    "search event t4 Rem",
    "search t6 Rin",
    "search Nezuko",
    "search 5d7577216f818277a57e5698",
  ],
  description:
    "Fetch all cards by tier & name. Returns the card info if only one was found.",
};

module.exports = {
  execute: async (instance, message, args) => {
    if (args.length === 0) return false;

    const isEvent = EVENT.includes(args[0].toLowerCase());
    const isGlobal = GLOBAL.includes(args[0].toLowerCase());
    const isOldGlobal = OLD_GLOBAL.includes(args[0].toLowerCase());

    if (isEvent || isGlobal || isOldGlobal) args.shift();
    if (args.length === 0) return false;
    const hasTier = Constants.allTiers.includes(args[0].toLowerCase());
    const hasCardId = cardId.test(args[0]);
    if (hasTier && args.length === 1) return false;
    const tier = hasTier ? args.shift()[1].toUpperCase() : "all";
    const card_id = hasCardId ? cardId.exec(args.shift())[2] : null;
    let card = null;
    let cards = [];
    if (card_id) {
      card =
        (await Fetcher.fetchById(instance, card_id, isEvent)) ||
        (!isEvent
          ? await Fetcher.fetchById(instance, card_id, !isEvent)
          : null);
    } else {
      const name = args.join(" ");
      cards =
        (await Fetcher.fetchAllByName(instance, name, tier, isEvent)) ||
        (name.indexOf(" ") !== -1
          ? await Fetcher.fetchAllByName(
              instance,
              [...args.slice(-1), ...args.slice(0, -1)].join(" "),
              tier,
              isEvent
            )
          : []);
    }
    if (cards.length === 0 && card === null) {
      const embed = new MessageEmbed()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> No cards found for that criteria.`
        )
        .setColor(Color.red);
      message.channel.send(embed);
      return null;
    }
    if (card) return getCard(instance, message, card, isGlobal);
    if (cards.length === 1)
      return getCard(instance, message, cards[0], isGlobal);

    const tierSettings = tier !== "all" ? tierInfo[`T${tier}`] : null;
    let last = false;

    const handler = async (page, author, index, msg) => {
      if (index !== false) {
        const selectCard = cards[index] || false;
        if (!selectCard) return null;
        const embed = await getCard(
          instance,
          message,
          selectCard,
          isGlobal,
          msg
        );
        last = embed;
        return true;
      }
      if (index === false && last !== false) last.stop("exited card");
      last = false;

      const names = [];
      const source = [];

      for (const [i, item] of cards.entries()) {
        names.push(
          `> **${i + 1}.** \`T${item.tier}\` • [\`${item.name.substr(
            0,
            18
          )}\`]` + `(https://animesoul.com/cards/info/${item.id})`
        );

        const series = (item.series || []).filter(
          s => s.toLowerCase() !== item.name.toLowerCase()
        );
        let src = item.series[0];
        if (isEvent) src = series[series.length - 1];
        source.push(`> \`${src.substr(0, 24) || "-"}\``);
      }

      return new MessageEmbed()
        .setTitle(
          `${
            tierSettings ? tierSettings.emoji : "<:Flame:783439293506519101>"
          } Card Search`
        )
        .setURL("https://animesoul.com/cards")
        .setColor(tierSettings ? tierSettings.color : Color.default)
        .setDescription(
          `✏️ Send **${
            cards.length > 2 ? `1-${cards.length}` : "1"
          }** to view a specific card.`
        )
        .addField("•   **N.** `T ` • __**Cards**__", names, true)
        .addField(`•   __${isEvent ? "Event" : "Source"}__`, source, true);
    };

    return createMessagePagedResults(message, 1, handler);
  },
  info,
};

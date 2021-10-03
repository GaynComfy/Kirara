const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");
const { MessageEmbed } = require("discord.js");
const { getCard } = require("./utils");
const { cardId } = require("../../utils/regexUtils");

const EVENT = ["event", "e"]; // Consider placing this in utils as it's used in multiple files
const GLOBAL = ["servers", "bot", "s"];
const OLD_GLOBAL = ["global", "g"];

const info = {
  name: "card",
  aliases: ["c"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
  perms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
  usage: "card [event] [servers] [tier] <name/card ID/link>",
  examples: [
    "card servers t6 Alice",
    "card event t4 Rem",
    "card t6 Rin",
    "card Nezuko",
    "card 5d7577216f818277a57e5698",
  ],
  description: "Fetch a card by tier & name",
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
        (name.indexOf(" ") !== -1
          ? await Fetcher.fetchByName(
              instance,
              [...args.slice(-1), ...args.slice(0, -1)].join(" "),
              tier,
              isEvent
            )
          : null);
    }
    if (card === null) {
      const embed = new MessageEmbed()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> No card found for that criteria.`
        )
        .setColor(Color.red);
      message.channel.send(embed);
      return null;
    }

    return getCard(instance, message, card, isGlobal);
  },
  info,
};

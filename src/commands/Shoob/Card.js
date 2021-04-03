const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const { getCard } = require("./utils");

const info = {
  name: "card",
  aliases: ["c"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
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
      args[0].toLowerCase() === "servers" ||
      args[0].toLowerCase() === "bot" ||
      args[0].toLowerCase() === "s";
    const isOldGlobal =
      args[0].toLowerCase() === "global" || args[0].toLowerCase() === "g";
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
      const embed = new MessageEmbed()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> No card found for that criteria.`
        )
        .setColor(Color.red);
      message.channel.send(embed);
      return null;
    }

    message.channel.stopTyping();
    return await getCard(instance, message, card, isGlobal);
  },
  info,
  help: {
    usage: "card [event] [servers] [tier] <name/card ID/link>",
    examples: [
      "card servers t6 Alice",
      "card event t4 Rem",
      "card t6 Rin",
      "card Nezuko",
      "card 5d7577216f818277a57e5698",
    ],
    description: "Fetch a card by tier & name",
  },
};

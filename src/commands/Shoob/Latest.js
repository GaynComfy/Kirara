const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");
const { tierInfo } = require("../../utils/cardUtils");

const info = {
  name: "latest",
  aliases: ["cards", "l"],
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6", "ts"];

module.exports = {
  execute: async (instance, message, args) => {
    const isEvent =
      args.length >= 1 &&
      (args[0].toLowerCase() === "event" || args[0].toLowerCase() === "e");
    if (isEvent) args.shift();
    if (isEvent && args.length === 0) return false;
    const hasTier = args.length >= 1 && allowed.includes(args[0].toLowerCase());
    if (!hasTier) return false;
    const tier = args.shift()[1].toUpperCase();

    message.channel.startTyping();
    message.channel.stopTyping();

    let last = -1;
    return await createPagedResults(message, Infinity, async (page) => {
      const offset = (page > last && last !== -1 ? last : page) * 8;
      const result = await Fetcher.fetchByTier(
        instance,
        tier,
        offset,
        "8",
        isEvent
      );
      if (result.length === 0 && last === -1) {
        last = page - 1;
      } else if (result.length < 8 && last === -1) {
        last = page;
      }
      if (last !== -1 && page > last) return null;
      const singlePage = last === page && page === 0;

      const cards = [];
      const series = [];

      result.map((e) => {
        cards.push(
          `> [\`${e.name}\`](https://animesoul.com/cards/info/${e.id})`
        );
        series.push(
          `> \`${
            (e.series || []).filter(
              (s) => s.toLowerCase() !== e.name.toLowerCase()
            )[0] || "-"
          }\``
        );
      });

      const tierSettings = tierInfo[`T${tier}`];
      const embed = new MessageEmbed()
        .setTitle(
          `${tierSettings.emoji} Latest added ${
            isEvent ? "Event " : ""
          }T${tier}`
        )
        .setColor(tierSettings.color)
        .setURL(`https://animesoul.com/cards`)
        .addField("•   **__Cards__**", cards, true)
        .addField("•   **__Series__**", series, true)
        .setFooter(
          (!singlePage
            ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1}`
            : "") +
            (last === -1 || page < last ? " | React ▶️ for next page" : "") +
            (page !== 0 ? " | React ◀️ to go back" : "")
        );
      if (last === 0) {
        await message.channel.send(embed);
        return false;
      }
      return embed;
    });
  },
  info,
  help: {
    usage: "latest [event] <tier>",
    examples: ["latest ts", "l e t6"],
    description: "Watch the latest added cards per-tier!",
  },
};

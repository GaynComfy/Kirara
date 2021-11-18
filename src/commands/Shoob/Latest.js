const Fetcher = require("../../utils/CardFetcher");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");
const { tierInfo } = require("../../utils/cardUtils");

const { EVENT } = require("./utils").constants;

const info = {
  name: "latest",
  aliases: ["cards", "l"],
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
  perms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
  disabled: true,
  usage: "latest [event] <tier>",
  examples: ["latest ts", "l e t6"],
  description: "Watch the latest added cards per-tier!",
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6", "ts"];

module.exports = {
  execute: async (instance, message, args) => {
    const isEvent = args.length >= 1 && EVENT.includes(args[0].toLowerCase());

    if (isEvent) args.shift();
    if (isEvent && args.length === 0) return false;
    if (!allowed.includes(args[0].toLowerCase())) return false;

    const tier = args.shift()[1].toUpperCase();

    let last = -1;
    return createPagedResults(message, Infinity, async page => {
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
        if (last === -1) last = 0;
      } else if (result.length < 8 && last === -1) {
        last = page;
      }
      if (last !== -1 && page > last) return null;
      const singlePage = last === page && page === 0;

      const cards = [];
      const series = [];

      result.map(e => {
        cards.push(
          `> [\`${e.name.substr(0, 26)}\`](https://animesoul.com/cards/info/${
            e.id
          })`
        );
        series.push(
          `> \`${
            (e.series || []).filter(
              s => s.toLowerCase() !== e.name.toLowerCase()
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
        .addField("•   **__Cards__**", cards.join("\n"), true)
        .addField("•   **__Series__**", series.join("\n"), true)
        .setFooter(
          (!singlePage
            ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1}`
            : "") +
            (last === -1 || page < last ? " | React ▶️ for next page" : "") +
            (page !== 0 ? " | React ◀️ to go back" : "")
        );
      if (last === 0) {
        await message.channel.send({ embeds: [embed] });
        return false;
      }
      return embed;
    });
  },
  info,
};

const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");
const { tierInfo } = require("../../utils/cardUtils");

const info = {
  name: "inventory",
  aliases: ["inv"],
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6", "ts"];

module.exports = {
  execute: async (instance, message, args) => {
    let user = message.mentions.users.first();
    if (user) {
      args.shift();
    } else {
      user = message.author;
    }
    if (args.length === 1 && !allowed.includes(args[0])) return false;
    if (args.length >= 2) return false;
    const hasTier = args.length === 1 && allowed.includes(args[0]);
    const tier = hasTier ? args[0][1].toUpperCase() : null;
    let last = -1;
    createPagedResults(message, Infinity, async (page) => {
      const offset = (page > last && last !== -1 ? last : page) * 10;
      const result = await Fetcher.fetchInventory(
        instance,
        user.id,
        tier,
        offset,
        "10"
      );
      if (result.length < 10 && last === -1) {
        last = page;
      }
      if (last !== -1 && page > last) return null;
      const singlePage = last === page && page === 0;
      const tierSettings = tier ? tierInfo[`T${tier}`] : null;
      const embed = new MessageEmbed()
        .setAuthor(
          `${user.username}'s Inventory`,
          user.displayAvatarURL({ format: "png" })
        )
        .setColor(tier ? tierSettings.color : Color.default)
        .setURL(`https://animesoul.com/user/${user.id}`)
        .setFooter(
          (!singlePage
            ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1} | `
            : "") +
            (!last ? "React ▶️ for next page | " : "") +
            (!singlePage && page !== 0 ? "React ◀️ to go back" : "")
        );
      embed.addField(
        `__Cards__`,
        result.length > 0
          ? result.map(
              (e) =>
                `> \`T${e.tier.toUpperCase()}\` • ` +
                `[\`${e.name}\`](https://animesoul.com/cards/info/${e.card_id}) ` +
                `| \`Issue: ${e.issue}\``
            )
          : "- No cards <:SShoob:783636544720207903>"
      );
      return embed;
    });
    return true;
  },
  info,
  help: {
    usage: "inventory [@user] [t1/t2/t3/t4/t5/t6/ts]",
    examples: ["s!inventory @Alycans", "s!inv @Liz3 t6", "s!inv"],
    description: "Fetch a users inventory",
  },
};

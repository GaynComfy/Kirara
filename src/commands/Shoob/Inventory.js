const Fetcher = require("../../utils/CardFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");
const { tierInfo } = require("../../utils/cardUtils");
const { map } = require("../../utils/GifFetcher");

const info = {
  name: "inventory",
  aliases: ["inv"],
  matchCase: false,
  category: "Shoob",
  cooldown: 25,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6", "ts"];

module.exports = {
  execute: async (instance, message, args) => {
    const user = message.mentions.users.first();
    if (!user) return false;
    const hasTier = args.length === 2 && allowed.includes(args[1]);
    const tier = hasTier ? args[1][1].toUpperCase() : null;
    let last = -1;
    createPagedResults(message, Infinity, async (page) => {
      const offset = (page > last && last !== -1 ? last : page) * 8;
      const result = await Fetcher.fetchInventory(
        instance,
        user.id,
        tier,
        offset
      );
      if (result.length < 8 && last === -1) {
        last = page;
      }
      if (last !== -1 && page > last) return null;
      const embed = new MessageEmbed()
        .setTitle(` •  ${user.username} Inventory   • `)
        .setURL(`https://animesoul.com/user/${user.id}`)
        .setDescription(
          `Page: ${last !== -1 && page >= last ? "Last" : page + 1} ${
            tier ? `Tier: ${args[1].toUpperCase()}` : ""
          }`
        );
      embed.addField(
        `•**Cards**•`,
        result.length > 0
          ? result.map(
              (e) =>
                `[${e.name}](https://animesoul.com/cards/info/${e.card_id}) | Issue: ${e.issue}`
            )
          : "No Cards found",
        true
      );
      return embed;
    });
    return true;
  },
  info,
  help: {
    usage: "inventory @User [t1,t2,t3,t4,t5,t6.ts]",
    examples: ["s!inventory @Alycans", "s!inv @Liz3 t6"],
    description: "Fetch a users inventory",
  },
};

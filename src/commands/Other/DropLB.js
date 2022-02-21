const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");

const info = {
  name: "droplb",
  aliases: ["dlb"],
  matchCase: false,
  category: "UwU",
  disabled: process.env.NODE_ENV !== "development",
};

module.exports = {
  execute: async (instance, message) => {
    const keys = await instance.cache.keys(`kdrop:${message.guild.id}:*`);
    const values = await Promise.all(
      keys.map(
        key =>
          new Promise(resolve => {
            instance.cache.get(key).then(val => {
              resolve({
                value: val,
                id: key.split(":")[2],
              });
            });
          })
      )
    );
    if (values.length === 0) {
      const embed = new MessageEmbed()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> This server has no dropped cards this month.`
        )
        .setColor(Color.red);
      return await message.channel.send({ embeds: [embed] });
    }

    const sorted = values.sort((a, b) => b.value - a.value);
    let last = -1;
    return createPagedResults(message, Infinity, async page => {
      const offset = (page > last && last !== -1 ? last : page) * 8;
      const spawners = sorted.slice(offset, offset + 8);

      if (spawners.length === 0 && last === -1) {
        last = page - 1;
        if (last === -1) last = 0;
      } else if (spawners.length < 8 && last === -1) {
        last = page;
      }
      if (last !== -1 && page > last) return null;
      const singlePage = last === page && page === 0;

      const users = [];
      const spawns = [];

      for (const [i, entry] of spawners.entries()) {
        const user = await instance.client.users.fetch(entry.id);
        const mention = user ? `<@!${user.id}>` : "`User left`";
        users.push(`> \`${i + 1 + page * 8}.\` ${mention}`);
        spawns.push(
          `> \`${entry.value} ${entry.value === "1" ? "card" : "cards"}\``
        );
      }

      const embed = new MessageEmbed()
        .setAuthor({
          name: `Karuta drop Leaderboard!`,
          iconURL: message.guild.iconURL({ dynamic: true }),
        })
        .setColor(spawners.length > 0 ? "#da7357" : Color.red)
        .setImage(Constants.footer)
        .setFooter({
          text:
            (!singlePage
              ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1}`
              : "") +
            (last === -1 || page < last ? " | React ▶️ for next page" : "") +
            (page !== 0 ? " | React ◀️ to go back" : ""),
        })
        .addField(`•   __User__`, users.join("\n"), true)
        .addField(`•   __Drops__`, spawns.join("\n"), true);

      if (last === 0) {
        await message.channel.send({ embeds: [embed] });
        return false;
      }
      return embed;
    });
  },
  info,
  help: {
    usage: "droplb",
    examples: ["droplb"],
    description: "Top Karuta drops on the server!",
  },
};

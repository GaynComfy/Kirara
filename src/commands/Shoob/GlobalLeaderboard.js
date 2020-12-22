const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");

const info = {
  name: "globalleaderboard",
  aliases: ["glb"],
  matchCase: false,
  category: "Shoob",
};

module.exports = {
  execute: async (instance, message, args) => {
    const isTotal =
      args.length >= 1 &&
      (args[0].toLowerCase() === "total" ||
        args[0].toLowerCase() === "t" ||
        args[0].toLowerCase() === "a");
    if (isTotal) args.shift();

    let last = -1;

    return await createPagedResults(message, Infinity, async (page) => {
      const offset = (page > last && last !== -1 ? last : page) * 8;
      const { rows: claimers } = isTotal
        ? await instance.database.pool.query(
            "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
              "GROUP BY discord_id ORDER BY c DESC LIMIT 8 OFFSET $1",
            [offset]
          )
        : await instance.database.pool.query(
            "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
              "AND season=$1 GROUP BY discord_id ORDER BY c DESC LIMIT 8 OFFSET $2",
            [instance.config.season, offset]
          );
      if (claimers.length === 0 && page === 0) {
        const embed = new MessageEmbed()
          .setDescription(
            `<:Sirona_NoCross:762606114444935168> The bot hasn't tracked any claims${
              isTotal ? "" : " this season"
            }.`
          )
          .setColor(Color.red);
        await message.channel.send(embed);
        return false;
      }
      if (claimers.length < 8 && last === -1) {
        last = page;
      }
      if (last !== -1 && page > last) return null;
      const singlePage = last === page && page === 0;

      const users = [];
      const claims = [];

      for (const entry of claimers) {
        const user = await instance.client.users.fetch(entry.discord_id);
        const tag = user
          ? `${user.username}#${user.discriminator}`
          : "Unknown user";
        users.push(`> \`${tag}\``);
        claims.push(`> \`${entry.c} ${entry.c === 1 ? "claim" : "claims"}\``);
      }

      const embed = new MessageEmbed()
        .setAuthor("Global Leaderboard", Constants.avatar)
        .setColor(claimers.length > 0 ? "#f49e17" : Color.red)
        .setImage(Constants.footer)
        .setFooter(
          (!singlePage
            ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1}`
            : "") +
            (last === -1 || page < last ? " | React ▶️ for next page" : "") +
            (page !== 0 ? " | React ◀️ to go back" : "")
        )
        .addField(`•   __User__`, users, true)
        .addField(`•   __Claims__`, claims, true);

      if (last === 0) {
        await message.channel.send(embed);
        return false;
      }
      return embed;
    });
  },
  info,
  help: {
    usage: "glb [total]",
    examples: ["glb", "glb [total]"],
    description: "Top global claims!",
  },
};

const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");
const { EmbedBuilder } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");

const info = {
  name: "altleaderboard",
  aliases: ["alb", "tlb"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
  slashSupport: true,
  perms: ["AddReactions", "ManageMessages", "ReadMessageHistory"],
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

    await createPagedResults(message, Infinity, async page => {
      const offset = (page > last && last !== -1 ? last : page) * 8;
      const { rows: claimers } = isTotal
        ? await instance.database.pool.query(
            "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
              "AND server_id=$1 GROUP BY discord_id ORDER BY c DESC LIMIT 8 OFFSET $2",
            [instance.serverIds[message.guild.id], offset]
          )
        : await instance.database.pool.query(
            "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
              "AND server_id=$1 AND season=$2 GROUP BY discord_id ORDER BY c DESC LIMIT 8 OFFSET $3",
            [
              instance.serverIds[message.guild.id],
              instance.config.season,
              offset,
            ]
          );
      if (claimers.length === 0 && page === 0) {
        const embed = new EmbedBuilder()
          .setDescription(
            `<:Sirona_NoCross:762606114444935168> This server has no claimed cards${
              isTotal ? "" : " this season"
            }.`
          )
          .setColor(Color.red);
        await message.channel.send({ embeds: [embed] });
        return false;
      }
      if (claimers.length === 0 && last === -1) {
        last = page - 1;
        if (last === -1) last = 0;
      } else if (claimers.length < 8 && last === -1) {
        last = page;
      }
      if (last !== -1 && page > last) return null;
      const singlePage = last === page && page === 0;

      const users = [];
      const claims = [];

      for (const [i, entry] of claimers.entries()) {
        const user = await instance.client.users.fetch(entry.discord_id);
        const mention = user ? `<@!${user.id}>` : "`User left`";
        users.push(`> \`${i + 1 + page * 8}.\` ${mention}`);
        claims.push(`> \`${entry.c} ${entry.c === "1" ? "claim" : "claims"}\``);
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${message.guild.name}'s ${isTotal ? "Total " : ""}Leaderboard`,
          iconURL: message.guild.iconURL({ dynamic: true }),
        })
        .setColor(claimers.length > 0 ? "#f49e17" : Color.red)
        .setImage(Constants.footer)
        .setFooter({
          text:
            (!singlePage
              ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1}`
              : "឵") +
            (last === -1 || page < last ? " | React ▶️ for next page" : "") +
            (page !== 0 ? " | React ◀️ to go back" : ""),
        })
        .addFields([
          { name: `•   __User__`, value: users.join("\n"), inline: true },
          { name: `•   __Claims__`, value: claims.join("\n"), inline: true },
        ]);

      if (last === 0) {
        await message.channel.send({ embeds: [embed] });
        return false;
      }
      return embed;
    });
    return true;
  },
  info,
  arguments: [
    {
      type: "boolean",
      name: "Total",
      description: "Do not limit to current season",
      required: false,
      mapping: [null, "t"],
    },
  ],
  help: {
    usage: "alb [total]",
    examples: ["alb", "tlb [total]"],
    description: "Top claims on the server, but without images!",
  },
};

const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../../utils/PagedResults");

const info = {
  name: "altleaderboard",
  aliases: ["alb", "tlb"],
  matchCase: false,
  category: "Shoob",
};

module.exports = {
  execute: async (instance, message, args) => {
    const {
      rows: [server],
    } = await instance.database.simpleQuery("SERVERS", {
      id: instance.serverIds[message.guild.id],
    });
    const event = server.event;

    let last = -1;

    createPagedResults(message, Infinity, async (page) => {
      const offset = (page > last && last !== -1 ? last : page) * 8;
      const { rows: claimers } = event
        ? await instance.database.pool.query(
            "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
              "AND server_id=$1 AND time > $2 GROUP BY discord_id ORDER BY c DESC LIMIT 8 OFFSET $3",
            [server.id, server.event_time, offset]
          )
        : await instance.database.pool.query(
            "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
              "AND server_id=$1 GROUP BY discord_id ORDER BY c DESC LIMIT 8 OFFSET $2",
            [server.id, offset]
          );
      if (claimers.length < 8 && last === -1) {
        last = page;
      }
      if (last !== -1 && page > last) return null;
      const singlePage = last === page && page === 0;

      const users = [];
      const claims = [];

      for (const entry of claimers) {
        const user = await instance.client.users.fetch(entry.discord_id);
        const mention = user ? `<@!${user.id}>` : "`User left`";
        users.push(`> ${mention}`);
        claims.push(`\`${entry.c} ${entry.c === 1 ? "claim" : "claims"}\``);
      }

      const embed = new MessageEmbed()
        .setAuthor(
          `${message.guild.name}'s Leaderboard`,
          message.guild.iconURL()
        )
        .setColor(claimers.length > 0 ? "#f49e17" : Color.red)
        .setImage(
          "https://cdn.discordapp.com/attachments/755444853084651572/769403818600300594/GACGIF.gif"
        )
        .setFooter(
          (!singlePage
            ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1}`
            : "") +
            (last === -1 || page < last ? " | React ▶️ for next page" : "") +
            (page !== 0 ? " | React ◀️ to go back" : "")
        );

      if (claimers.length === 0) {
        embed.addDescription(
          "<:Sirona_NoCross:762606114444935168> This server has no claimed cards."
        );
      } else {
        embed.addField(`__User__`, users, true);
        embed.addField(`__Claims__`, claims, true);
      }

      return embed;
    });

    return true;
  },
  info,
  help: {
    usage: "alb",
    examples: ["alb", "tlb"],
    description: "Top claims on the server, but without images!",
  },
};

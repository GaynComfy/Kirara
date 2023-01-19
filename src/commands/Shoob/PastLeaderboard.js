const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");
const { EmbedBuilder } = require("discord.js");

const info = {
  name: "pastleaderboard",
  aliases: ["plb"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
};

module.exports = {
  execute: async (instance, message) => {
    message.channel.sendTyping().catch(() => null);

    const { rows: claimers } = await instance.database.pool.query(
      "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
        "AND server_id=$1 AND season=$2 GROUP BY discord_id ORDER BY c DESC LIMIT 10",
      [instance.serverIds[message.guild.id], instance.config.season - 1]
    );
    if (claimers.length === 0) {
      const embed = new EmbedBuilder()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> This server has no claimed cards for the past season.`
        )
        .setColor(Color.red);
      await message.channel.send({ embeds: [embed] });
      return true;
    }

    const users = [];
    const claims = [];

    for (const [i, entry] of claimers.entries()) {
      const user = await instance.client.users.fetch(entry.discord_id);
      const mention = user ? `<@!${user.id}>` : "`User left`";
      users.push(`> \`${i + 1}.\` ${mention}`);
      claims.push(`> \`${entry.c} ${entry.c === "1" ? "claim" : "claims"}\``);
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${message.guild.name}'s Past Season Leaderboard`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setColor(claimers.length > 0 ? "#f49e17" : Color.red)
      .setImage(Constants.footer)
      .addFields([
        { name: `•   __User__`, value: users.join("\n"), inline: true },
        { name: `•   __Claims__`, value: claims.join("\n"), inline: true },
      ]);

    await message.channel.send({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "plb",
    examples: ["plb"],
    description: "See the past season's server leaderboard!",
  },
};

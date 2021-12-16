const Color = require("../utils/Colors.json");
const Constants = require("../utils/Constants.json");
const { MessageEmbed } = require("discord.js");
const { createPagedResults } = require("../utils/PagedResults");
let interval = null;
const send = async (instance, server_id, channel_id) => {
  const server = await instance.client.guilds.fetch(server_id);
  const channel = await server.channels.fetch(channel_id);
  // fk me
  const message = {
    channel,
    guild: server,
    reply: (...args) => channel.send("Event has finished!", ...args),
  };
  message.channel.sendTyping().catch(() => null);
  let last = -1;

  createPagedResults(message, Infinity, async page => {
    const offset = (page > last && last !== -1 ? last : page) * 8;
    const { rows: claimers } = await instance.database.pool.query(
      "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
        "AND server_id=$1 AND time > $2 GROUP BY discord_id " +
        "ORDER BY c DESC LIMIT 8 OFFSET $3",
      [
        instance.serverIds[message.guild.id],
        instance.guilds[message.guild.id].event_time,
        offset,
      ]
    );
    if (claimers.length === 0 && page === 0) {
      const embed = new MessageEmbed()
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> This server has no claimed cards this event.`
        )
        .setColor(Color.red);
      await message.channel.send({ embeds: [embed] });
      return null;
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

    const embed = new MessageEmbed()
      .setAuthor(
        `${message.guild.name}'s Event Leaderboard`,
        message.guild.iconURL({ dynamic: true })
      )
      .setColor(claimers.length > 0 ? "#f49e17" : Color.red)
      .setImage(Constants.footer)
      .setFooter(
        (!singlePage
          ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1}`
          : "") +
          (last === -1 || page < last ? " | React ▶️ for next page" : "") +
          (page !== 0 ? " | React ◀️ to go back" : "")
      )
      .addField(`•   __User__`, users.join("\n"), true)
      .addField(`•   __Claims__`, claims.join("\n"), true);

    if (last === 0) {
      await message.channel.send({ embeds: [embed] });
      return null;
    }
    return embed;
  });
};
module.exports = {
  start(instance) {
    interval = setInterval(async () => {
      for (const key in instance.timedEvents) {
        const { val, channel } = instance.timedEvents[key];
        if (Date.now() > val) {
          send(instance, key, channel);
          delete instance.timedEvents[key];
          const update = {
            event: false,
          };
          await instance.database.simpleUpdate(
            "SERVERS",
            {
              guild_id: key,
            },
            update
          );
          instance.guilds[key] = {
            ...instance.guilds[key],
            ...update,
          };
        }
      }
    }, 1000);
  },
  stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  },
};

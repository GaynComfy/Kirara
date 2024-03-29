const { getInfo } = require("../Owner/utils");
const info = {
  name: "server",
  aliases: ["serverstats"],
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};

module.exports = {
  execute: async (instance, message) => {
    const results = await Promise.all([
      instance.client.shard.fetchClientValues("guilds.cache.size"),
      instance.client.shard.broadcastEval(client =>
        client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
      ),
      instance.client.shard.broadcastEval(client =>
        client.guilds.cache.map(guild => guild.channels.cache.size)
      ),
      instance.database.pool
        .query("SELECT claims, spawns FROM SERVERS WHERE id=$1", [
          instance.serverIds[message.guild.id],
        ])
        .then(r => r.rows),
      instance.database.pool
        .query(
          "SELECT claims, guild_name FROM SERVERS ORDER BY claims DESC LIMIT 5"
        )
        .then(r => r.rows),
    ]);
    const totalGuilds = results[0].reduce(
      (acc, guildCount) => acc + guildCount,
      0
    );
    const totalMembers = results[1].reduce(
      (acc, memberCount) => acc + memberCount,
      0
    );
    const channels = results[2].flat();
    const recentCards = results[3];
    // const {rows: topServers} = await instance.database.pool.query("SELECT COUNT(CARD_CLAIMS.id) as amount, SERVERS.guild_name as name, CARD_CLAIMS.server_id as sid FROM CARD_CLAIMS LEFT JOIN SERVERS ON CARD_CLAIMS.server_id=SERVERS.id GROUP BY name, sid ORDER BY amount DESC LIMIT 5")
    const topServers = results[4];
    const topped = topServers.map(
      e =>
        `• ${e.guild_name} :: ${Number.parseInt(e.claims).toLocaleString(
          undefined,
          {
            style: "decimal",
            maximumFractionDigits: 0,
          }
        )}`
    );
    const { upDays, upHours, upMinutes: upMins, cpu } = getInfo();
    // todo change this oh my god
    const stats = `\`\`\`asciidoc
= STATISTICS =
• Mem Usage  :: ${cpu}
• Uptime     :: ${upDays} Days, ${upHours} Hours, ${upMins} Minutes
• Shard      :: ${(instance.client.shard && instance.client.shard.ids[0]) || 0}
• Users      :: ${totalMembers.toLocaleString(undefined, {
      style: "decimal",
      maximumFractionDigits: 0,
    })}
• Servers    :: ${totalGuilds.toLocaleString(undefined, {
      style: "decimal",
      maximumFractionDigits: 0,
    })}
• Channels   :: ${channels
      .reduce((a, b) => a + b, 0)
      .toLocaleString(undefined, {
        style: "decimal",
        maximumFractionDigits: 0,
      })}

= SERVER/GUILD =
• Name       :: ${message.guild.name}
• Claims     :: ${Number.parseInt(recentCards[0].claims).toLocaleString(
      undefined,
      { style: "decimal", maximumFractionDigits: 0 }
    )}
• Spawns     :: ${Number.parseInt(recentCards[0].spawns).toLocaleString(
      undefined,
      { style: "decimal", maximumFractionDigits: 0 }
    )}

= TOP 5 SERVERS =
${topped.join("\n")}
\`\`\``;
    await message.channel.send(stats);
    return true;
  },
  info,
  help: {
    usage: "server",
    examples: ["server"],
    description: "Information about your server stats!",
  },
};

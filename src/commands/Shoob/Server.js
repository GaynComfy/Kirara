const { tierInfo } = require("../../utils/cardUtils");
const { getInfo } = require("../Owner/utils");
const info = {
  name: "serverstats",
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6"];

module.exports = {
  execute: async (instance, message, args) => {
    const promises = [
      instance.client.shard.fetchClientValues("guilds.cache.size"),
      instance.client.shard.broadcastEval(
        "this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)"
      ),
      instance.client.shard.broadcastEval("this.guilds.cache"),
      instance.client.shard.broadcastEval(
        "this.guilds.cache.map((guild) => guild.channels.cache.size)"
      ),
    ];
    const results = await Promise.all(promises);
    const totalGuilds = results[0].reduce(
      (acc, guildCount) => acc + guildCount,
      0
    );
    const totalMembers = results[1].reduce(
      (acc, memberCount) => acc + memberCount,
      0
    );
    var channels = results[3].flat();
    const {
      rows: recentCards,
    } = await instance.database.pool.query(
      "SELECT claims FROM SERVERS WHERE id=$1",
      [instance.serverIds[message.guild.id]]
    );
    // const {rows: topServers} = await instance.database.pool.query("SELECT COUNT(CARD_CLAIMS.id) as amount, SERVERS.guild_name as name, CARD_CLAIMS.server_id as sid FROM CARD_CLAIMS LEFT JOIN SERVERS ON CARD_CLAIMS.server_id=SERVERS.id GROUP BY name, sid ORDER BY amount DESC LIMIT 5")
    const { rows: topServers } = await instance.database.pool.query(
      "SELECT claims, guild_name FROM SERVERS ORDER BY claims DESC LIMIT 5"
    );
    const topped = topServers.map(
      (e) =>
        `• ${e.guild_name} :: ${Number.parseInt(e.claims).toLocaleString(
          undefined,
          {
            style: "decimal",
            maximumFractionDigits: 0,
          }
        )}`
    );
    const { upDays, upHours, upMins, cpu } = getInfo();
    const stats = `
    \`\`\`asciidoc
    = STATISTICS =
    • Mem Usage  :: ${cpu}
    • Uptime     :: ${upDays} Days, ${upHours} Hours, ${upMins} Minutes
    • Shards     :: 3
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
    • Claims     :: ${Number.parseInt(
      recentCards[0].claims
    ).toLocaleString(undefined, { style: "decimal", maximumFractionDigits: 0 })}
    
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

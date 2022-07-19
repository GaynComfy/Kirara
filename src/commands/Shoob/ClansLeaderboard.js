const Constants = require("../../utils/Constants.json");
const { EmbedBuilder } = require("discord.js");

const info = {
  name: "clansleaderboard",
  aliases: ["clb"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
};

const clans = {
  "Stygian Rogues": "789481061389434900",
  // Oasis: "813217659772076043",
  "Forsaken Clan": "813251025867243551",
  Frost: "855985381115953163",
};
const eventStart = new Date(1657990800000);
const eventStop = new Date(1661274000000);

const clanNames = Object.keys(clans);
const clanIds = Object.values(clans);
const serverIds = {};
let knowsServers = false;

module.exports = {
  execute: async (instance, message) => {
    message.channel.sendTyping().catch(() => null);

    if (!knowsServers) {
      // we need to fetch the server IDs from our guild ID list.
      // generally, they are not supposed to mutate, so this is fine to do once
      // while not hardcoding stuff... outside of the IDs themselves.
      let query = "SELECT id, guild_id FROM SERVERS WHERE";
      clanIds.forEach((clan, i) => {
        if (i !== 0) query += " OR";
        query += ` guild_id='${clan}'`;
      });
      const { rows } = await instance.database.pool.query(query);
      rows.forEach(srv => (serverIds[srv.guild_id] = srv.id));
      knowsServers = true;

      const missing = clanIds.filter(gid => serverIds[gid] === undefined);
      if (missing.length !== 0) {
        console.error(`! WE ARE MISSING CLAN GUILDS: ${missing.join(" ")}`);
      }
    }

    // we're gonna push the queries to an array to Promise.all them
    const claimAmtQueries = [];
    const claimersQueries = [];
    clanIds.forEach(clan => {
      claimAmtQueries.push(
        instance.database.pool
          .query(
            "SELECT COUNT(id) c, claimed FROM CARD_CLAIMS WHERE server_id=$1 " +
              "AND time >= $2 AND time <= $3 GROUP BY claimed",
            [serverIds[clan] || 0, eventStart, eventStop]
          )
          .then(r => r.rows)
      );
      claimersQueries.push(
        instance.database.pool
          .query(
            "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
              "AND server_id=$1 AND time >= $2 AND time <= $3 GROUP BY discord_id ORDER BY c DESC LIMIT 1",
            [serverIds[clan] || 0, eventStart, eventStop]
          )
          .then(r => r.rows)
      );
    });
    const [claims, claimers] = await Promise.all([
      Promise.all(claimAmtQueries),
      Promise.all(claimersQueries),
    ]);

    // Get the information from clans, and sort it from most claims
    const clans = clanNames
      .map((clan, i) => {
        const c = claims[i];
        const claimd = c.find(f => f.claimed === true);
        const despawnd = c.find(f => f.claimed === false);
        const camt = claimd ? parseInt(claimd.c) : 0;
        const samt = camt + (despawnd ? parseInt(despawnd.c) : 0);

        return { name: clan, camt, samt, claimers: claimers[i] };
      })
      .sort((a, b) => {
        if (a.camt > b.camt) return -1;
        if (a.camt < b.camt) return 1;
        return 0;
      });

    const fields = [];
    for (const [i, clan] of clans.entries()) {
      let value = "> - Nothing yet! <:Shoob:910973650042236938>";

      if (clan.claimers.length !== 0) {
        const users = [];
        for (const [i, entry] of clan.claimers.entries()) {
          const user = await instance.client.users.fetch(entry.discord_id);
          const mention = user ? `\`${user.tag}\`` : `<@!${entry.discord_id}>`;
          users.push(
            `> ${
              i === 0 ? "<a:Sirona_star:748985391360507924>" : ` **${i + 1}.** `
            } ${mention} — **${entry.c} claims**`
          );
        }
        value = users.join("\n");
      }

      fields.push({
        name: `${
          i === 0 ? "<a:Sirona_star:748985391360507924>" : `឵ **${i + 1}.** `
        } ${clan.name} - ${clan.camt}/${clan.samt} claims`,
        value,
      });
    }
    fields.push({
      name: "឵ **X.**  Oasis - not shown by clan's request",
      value: "> ---",
    });

    const time = Date.now();
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Clan Wars Leaderboard",
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setColor("#d5417c")
      .setDescription(
        time >= eventStart && time < eventStop
          ? `<:Shoob:910973650042236938> **A WAR IS CURRENTLY ACTIVE!** <:Shoob:910973650042236938>\n`
          : "" +
              `> <t:${eventStart / 1000}:f> — <t:${eventStop / 1000}:f>` +
              ` (<t:${eventStop / 1000}:R>)`
      )
      .addFields(fields)
      .setImage(Constants.footer);

    return message.channel.send({ embeds: [embed] });
  },
  info,
  help: {
    usage: "clb",
    examples: ["clb"],
    description: "See the clan wars' global leaderboard!",
  },
};

const Constants = require("../../utils/Constants.json");
const { EmbedBuilder } = require("discord.js");

const info = {
  name: "clansleaderboardpcnt",
  aliases: ["clbp"],
  matchCase: false,
  category: "Shoob",
  cooldown: 2,
  disabled: process.env.NODE_ENV === "development",
};

const clans = {
  "Stygian Rogues": "789481061389434900",
  Oasis: "813217659772076043",
  "Forsaken Clan": "813251025867243551",
  Frost: "855985381115953163",
};
const dearUsers = [
  "505420217342754816",
  "475505022986092556",
  "473465372461236244",
];
const penalties = [0, 0, 0, 20];
const eventStart = new Date(1657990800000);
const eventStop = new Date(1661274000000);

const clanNames = Object.keys(clans);
const clanIds = Object.values(clans);

module.exports = {
  execute: async (instance, message) => {
    const time = Date.now();
    const showUsers =
      instance.config.owner.includes(message.author.id) ||
      dearUsers.includes(message.author.id);
    const running = time >= eventStart && time < eventStop;

    if (instance.shared["knowsClans"] !== clanIds.length) {
      // we need to fetch the server IDs from our guild ID list.
      // generally, they are not supposed to mutate, so this is fine to do once
      // while not hardcoding stuff... outside of the IDs themselves.
      let query = `SELECT id, guild_id FROM SERVERS WHERE ${clanIds
        .map(g => `guild_id='${g}'`)
        .join(" OR ")}`;
      const { rows } = await instance.database.pool.query(query);
      rows.forEach(srv => (instance.serverIds[srv.guild_id] = srv.id));
      instance.shared["knowsClans"] = clanIds.length;

      const missing = clanIds.filter(
        gid => instance.serverIds[gid] === undefined
      );
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
            [instance.serverIds[clan] || 0, eventStart, eventStop]
          )
          .then(r => r.rows)
      );
      claimersQueries.push(
        instance.database.pool
          .query(
            "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
              "AND server_id=$1 AND time >= $2 AND time <= $3 GROUP BY discord_id ORDER BY c DESC LIMIT 1",
            [instance.serverIds[clan] || 0, eventStart, eventStop]
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
      .map((name, i) => {
        const c = claims[i];
        const claimd = c.find(f => f.claimed === true);
        const despawnd = c.find(f => f.claimed === false);
        const penalty = penalties[i];
        const tamt = claimd ? parseInt(claimd.c) : 0;
        const camt = tamt - penalty;
        const samt = tamt + (despawnd ? parseInt(despawnd.c) : 0);
        const percent = ((100 * camt) / samt).toFixed(2);
        const tpercent = ((100 * tamt) / samt).toFixed(2);

        return {
          name,
          tamt,
          camt,
          samt,
          penalty,
          percent,
          tpercent,
          claimers: claimers[i],
        };
      })
      .sort((a, b) => {
        if (a.percent > b.percent) return -1;
        if (a.percent < b.percent) return 1;
        return 0;
      });

    let stats = "";
    for (const [i, clan] of clans.entries()) {
      let name = `\n> ${
        i === 0 ? "<a:Sirona_star:748985391360507924>" : `឵ **${i + 1}.**  `
      } **${clan.name} - ${clan.percent}% cards claimed**`;
      if (clan.camt !== clan.tamt) {
        name += ` [-${clan.penalty}, from ${clan.tpercent}%]`;
      }
      stats += name;

      if (showUsers) {
        let value = "> **-** Nothing yet! <:Shoob:910973650042236938>";
        if (clan.claimers.length !== 0) {
          const users = [];
          for (const [i, entry] of clan.claimers.entries()) {
            const user = await instance.client.users.fetch(entry.discord_id);
            const mention = user
              ? `\`${user.tag}\``
              : `<@!${entry.discord_id}>`;
            users.push(
              `> **-** ${
                i === 0
                  ? "<a:Sirona_star:748985391360507924>"
                  : ` **${i + 1}.** `
              } ${mention} — **${entry.c} claims**`
            );
          }
          value = users.join("\n");
        }
        stats += `\n${value}`;
      }
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Clan Wars Percentage Leaderboard",
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setColor("#d5417c")
      .setDescription(
        (running
          ? `<:Shoob:910973650042236938> **A WAR IS CURRENTLY ACTIVE!** <:Shoob:910973650042236938>\n`
          : "") +
          `> <t:${eventStart / 1000}:f> — <t:${eventStop / 1000}:f>` +
          ` (<t:${eventStop / 1000}:R>)\n` +
          stats
      )
      .setImage(Constants.footer);

    try {
      await message.author.send({ embeds: [embed] });
      await message.react("✅").catch(() => null);
    } catch (err) {
      console.error(err);
      return message.reply(
        "Looks like I was unable to DM you. Please check you have Direct Messages enabled in your Privacy Settings!"
      );
    }
    return true;
  },
  info,
  help: {
    usage: "clbp",
    examples: ["clbp"],
    description: "See the clan wars' global percentage leaderboard!",
  },
};

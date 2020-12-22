const { MessageEmbed } = require("discord.js");
const { tierInfo } = require("../../utils/cardUtils");
const Color = require("../../utils/Colors.json");

const info = {
  name: "season",
  matchCase: false,
  category: "Shoob",
  cooldown: 15,
};

module.exports = {
  execute: async (instance, message, args) => {
    let s = {
      claimed: [],
      despawn: [],
      claimers: {
        length: 0,
        top: [],
      },
    };
    const k = `season:${instance.serverIds[message.guild.id]}`;

    const exists = await instance.cache.exists(k);
    if (exists) {
      const e = await instance.cache.get(k);
      s = JSON.parse(e);
    } else {
      // ToDo: optimise database queries. really need to practice SQL again smh
      const {
        rows: claimed,
      } = await instance.database.pool.query(
        "SELECT COUNT(id) c, COUNT(discord_id) uc, tier FROM CARD_CLAIMS WHERE claimed=true " +
          "AND server_id=$1 AND season=$2 GROUP BY tier",
        [instance.serverIds[message.guild.id], instance.config.season]
      );
      const {
        rows: despawn,
      } = await instance.database.pool.query(
        "SELECT COUNT(id) c, tier FROM CARD_CLAIMS WHERE claimed=false " +
          "AND server_id=$1 AND season=$2 GROUP BY tier",
        [instance.serverIds[message.guild.id], instance.config.season]
      );
      const {
        rows: claimers,
      } = await instance.database.pool.query(
        "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
          "AND server_id=$1 GROUP BY discord_id ORDER BY c DESC",
        [instance.serverIds[message.guild.id]]
      );
      s = {
        claimed,
        despawn,
        claimers: {
          length: claimers.length,
          top: claimers.slice(0, 3),
        },
      };
      instance.cache.setExpire(k, JSON.stringify(s), 60 * 15);
    }

    const tiers = [];
    let claims = 0;
    let despawns = 0;
    let total = 0;
    Object.keys(tierInfo).forEach((t) => {
      if (t === "TS") return;
      const tier = tierInfo[t];
      const entry = s.claimed.find((e) => e.tier === t[1]);
      const count = entry ? entry.c : "0";
      const uc = parseInt(entry ? entry.uc : "0");

      const text = `${tier.emoji} x ${count}`;
      tiers.push(text);
      claims = claims + parseInt(count);
      total = total + parseInt(count);
    });
    s.despawn.forEach((entry, i) => {
      despawns = despawns + parseInt(entry.c);
      total = total + parseInt(entry.c);
    });

    const top3 = s.claimers.top.map(
      (entry, i) =>
        `> ` +
        (i === 0 ? "<a:Sirona_star:748985391360507924>" : `**${i + 1}.**`) +
        ` <@!${entry.discord_id}> - \`${entry.c} ${
          entry.c === 1 ? "claim" : "claims"
        }\``
    );

    const tiers1 = tiers.slice(0, 3);
    const tiers2 = tiers.slice(3, 6);

    const embed = new MessageEmbed()
      .setAuthor(
        `${message.guild.name}'s Season stats`,
        message.guild.iconURL()
      )
      .setColor(Color.pink)
      .setDescription(
        `In this season **${total} cards** have spawned:\n\n` +
          tiers1.join(" | ") +
          `\n` +
          tiers2.join(" | ") +
          `\n...for a total of **${claims} claims**!\n\n` +
          `<:KiraraShrug:784849773454557204> **${despawns} cards** have despawned.\n` +
          `**${claimers.length} users** have claimed cards on this server.` +
          (claimers.length > 0 ? `\n\n${top3.join("\n")}` : "")
      );
    message.channel.send(embed);
    return true;
  },
  info,
  help: {
    usage: "season",
    examples: ["season"],
    description: "Shows season information for the server!",
  },
};

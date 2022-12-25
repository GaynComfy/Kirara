const { EmbedBuilder } = require("discord.js");
const { tierInfo } = require("../../utils/cardUtils");
const Color = require("../../utils/Colors.json");

const info = {
  name: "season",
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};

module.exports = {
  execute: async (instance, message) => {
    let s;
    const k = `season:${message.guild.id}`;
    const exists = await instance.lruCache.has(k);
    if (exists) {
      s = instance.lruCache.get(k);
    } else {
      message.channel.sendTyping().catch(() => null);
      // ToDo: This is better, but could be improved!
      const [claims, claimers] = await Promise.all([
        instance.database.pool
          .query(
            "SELECT COUNT(id) c, tier, claimed FROM CARD_CLAIMS WHERE " +
              "server_id=$1 AND season=$2 GROUP BY tier, claimed",
            [instance.serverIds[message.guild.id], instance.config.season]
          )
          .then(r => r.rows),
        instance.database.pool
          .query(
            "SELECT COUNT(id) c, discord_id FROM CARD_CLAIMS WHERE claimed=true " +
              "AND server_id=$1 AND season=$2 GROUP BY discord_id ORDER BY c DESC",
            [instance.serverIds[message.guild.id], instance.config.season]
          )
          .then(r => r.rows),
      ]);
      const claimed = claims.filter(f => f.claimed === true);
      const despawns = claims
        .filter(f => f.claimed === false)
        .map(f => parseInt(f.c));
      claimed.forEach(f => Object.assign(f, { c: parseInt(f.c) }));

      s = {
        claimed,
        despawns: despawns.length === 0 ? 0 : despawns.reduce((a, b) => a + b),
        claimers: {
          c: claimers.length,
          top: claimers.slice(0, 3),
        },
      };
      instance.lruCache.set(k, s);
    }

    const tiers = [];
    let claims = 0;
    let total = 0;
    for (const t of Object.keys(tierInfo)) {
      if (t === "TS") continue;
      const tier = tierInfo[t];
      const entry = s.claimed.find(e => e.tier === t[1]);
      const count = entry ? entry.c : 0;

      const text = `${tier.emoji} x ${count}`;
      tiers.push(text);
      claims = claims + count;
      total = total + count;
    }
    total = total + s.despawns;

    const top3 = s.claimers.top.map(
      (entry, i) =>
        `> ` +
        (i === 0 ? "<a:Sirona_star:748985391360507924>" : `**${i + 1}.** `) +
        ` <@!${entry.discord_id}> - \`${entry.c} ${
          entry.c === "1" ? "claim" : "claims"
        }\``
    );

    const tiers1 = tiers.slice(0, 3);
    const tiers2 = tiers.slice(3, 6);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${message.guild.name}'s Season stats`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setColor(Color.pink)
      .setDescription(
        `In this season **${total} cards** have spawned:\n\n` +
          tiers1.join(" | ") +
          `\n` +
          tiers2.join(" | ") +
          `\n...for a total of **${claims} claims**!\n\n` +
          `<:KiraraShrug:784849773454557204> **${s.despawns} cards** have despawned.\n` +
          `**${s.claimers.c} users** have claimed cards on this server.` +
          (s.claimers.c > 0 ? `\n\n${top3.join("\n")}` : "")
      );
    return message.channel.send({ embeds: [embed] });
  },
  info,
  help: {
    usage: "season",
    examples: ["season"],
    description: "Shows season information for the server!",
  },
};

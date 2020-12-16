const { MessageEmbed } = require("discord.js");
const { tierInfo } = require("../../utils/cardUtils");
const Color = require("../../utils/Colors.json");

const info = {
  name: "season",
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};

module.exports = {
  execute: async (instance, message, args) => {
    const tiers = [];
    let claims = 0;
    let despawns = 0;
    let total = 0;
    let users = 0;
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
    Object.keys(tierInfo).forEach((t) => {
      if (t === "TS") return;
      const tier = tierInfo[t];
      const entry = claimed.find((e) => e.tier === t[1]);
      const count = entry ? entry.c : "0";
      const uc = parseInt(entry ? entry.uc : "0");

      const text = `${tier.emoji} x ${count}`;
      tiers.push(text);
      claims = claims + parseInt(count);
      users = users + parseInt(uc);
      total = total + parseInt(count);
    });
    despawn.forEach((entry, i) => {
      despawns = despawns + parseInt(entry.c);
      total = total + parseInt(entry.c);
    });

    const tiers1 = tiers.slice(0, 3);
    const tiers2 = tiers.slice(3, 6);

    const embed = new MessageEmbed()
      .setAuthor(`${message.guild.name} Season stats`, message.guild.iconURL())
      .setColor(Color.pink)
      .setDescription(
        `In this season **${total} cards** have spawned:\n\n` +
          tiers1.join(" | ") +
          `\n` +
          tiers2.join(" | ") +
          `\n...for a total of **${claims} claims**!\n\n` +
          `<:KiraraShrug:784849773454557204> **${despawns} cards** have despawned.\n` +
          `**${users} users** have claimed cards on this server.`
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

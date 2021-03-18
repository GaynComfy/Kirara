const { tierInfo } = require("../../utils/cardUtils");
const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");

const info = {
  name: "stats",
  aliases: ["t"],
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6"];

const mention = /<@!?(\d{17,19})>/;
const userId = /\d{17,19}/;

module.exports = {
  execute: async (instance, message, args) => {
    let member =
      message.mentions.users.first() ||
      (args.length >= 1 &&
        userId.test(args[0]) &&
        (await instance.client.users.fetch(args[0]).catch((err) => {})));
    if (args.length >= 1 && (mention.test(args[0]) || userId.test(args[0])))
      args.shift();
    if (!member) {
      member = message.author;
    }
    const isServer =
      args.length >= 1 &&
      (args[0].toLowerCase() === "server" || args[0].toLowerCase() === "s");
    if (isServer) args.shift();
    const isTotal =
      args.length >= 1 &&
      (args[0].toLowerCase() === "total" ||
        args[0].toLowerCase() === "t" ||
        args[0].toLowerCase() === "a");
    if (isTotal) args.shift();

    if (args.length === 0) {
      let tiers = [];
      const hugEmbed = new MessageEmbed()
        .setThumbnail(member.displayAvatarURL({ size: 2048, dynamic: true }))
        .setColor(Color.default);

      const result = isServer
        ? isTotal
          ? await instance.database.pool.query(
              "SELECT COUNT(id) c, tier FROM CARD_CLAIMS WHERE claimed=true " +
                "AND discord_id=$1 AND server_id=$2 GROUP BY tier",
              [member.id, instance.serverIds[message.guild.id]]
            )
          : await instance.database.pool.query(
              "SELECT COUNT(id) c, tier FROM CARD_CLAIMS WHERE claimed=true " +
                "AND discord_id=$1 AND server_id=$2 AND season=$3 GROUP BY tier",
              [
                member.id,
                instance.serverIds[message.guild.id],
                instance.config.season,
              ]
            )
        : isTotal
        ? await instance.database.pool.query(
            "SELECT COUNT(id) c, tier FROM CARD_CLAIMS WHERE claimed=true " +
              "AND discord_id=$1 GROUP BY tier",
            [member.id]
          )
        : await instance.database.pool.query(
            "SELECT COUNT(id) c, tier FROM CARD_CLAIMS WHERE claimed=true " +
              "AND discord_id=$1 AND season=$2 GROUP BY tier",
            [member.id, instance.config.season]
          );
      for (const t of allowed) {
        const tier = tierInfo[t.toUpperCase()];
        const entry = result.rows.find((e) => e.tier === t[1]);
        const count = entry ? entry.c : "0";

        const text = `${tier.emoji} x ${count}`;
        tiers.push(text);
      }
      const tiers1 = tiers.slice(0, 3);
      const tiers2 = tiers.slice(3, 6);

      hugEmbed.setDescription(`<:ID:782165519146156062> **${
        member.username
      }'s ${isTotal ? "total " : ""}${isServer ? "server " : ""}claims**
━━━━━━━━━━━━━━━
${tiers1.join(" | ")}
${tiers2.join(" | ")}
━━━━━━━━━━━━━━━`);
      await message.channel.send(hugEmbed);
    } else {
      if (!allowed.includes(args[0].toLowerCase())) return false;
      const result = isServer
        ? isTotal
          ? await instance.database.pool.query(
              "SELECT * FROM CARD_CLAIMS WHERE discord_id=$1 AND tier=$2 " +
                "AND server_id=$3 AND claimed=true ORDER BY id DESC",
              [
                member.id,
                args[0][1].toUpperCase(),
                instance.serverIds[message.guild.id],
              ]
            )
          : await instance.database.pool.query(
              "SELECT * FROM CARD_CLAIMS WHERE discord_id=$1 AND tier=$2 " +
                "AND server_id=$3 AND season=$4 AND claimed=true ORDER BY id DESC",
              [
                member.id,
                args[0][1].toUpperCase(),
                instance.serverIds[message.guild.id],
                instance.config.season,
              ]
            )
        : isTotal
        ? await instance.database.pool.query(
            "SELECT * FROM CARD_CLAIMS WHERE discord_id=$1 AND tier=$2 " +
              "AND claimed=true ORDER BY id DESC",
            [member.id, args[0][1].toUpperCase()]
          )
        : await instance.database.pool.query(
            "SELECT * FROM CARD_CLAIMS WHERE discord_id=$1 AND tier=$2 " +
              "AND season=$3 AND claimed=true ORDER BY id DESC",
            [member.id, args[0][1].toUpperCase(), instance.config.season]
          );
      const tier = tierInfo[args[0].toUpperCase()];
      const toDisplay = result.rows
        .slice(0, 5)
        .map(
          (e) =>
            `> \`Issue: ${e.issue}\` • ` +
            `[\`${e.card_name}\`](https://animesoul.com/cards/info/${e.card_id})`
        );
      const embed = new MessageEmbed()
        .setTitle(
          `<:ID:782165519146156062> **${member.username}'s ` +
            `${isTotal ? "total " : ""}${isServer ? "server " : ""}claims**`
        )
        .setThumbnail(member.displayAvatarURL({ size: 2048, dynamic: true }))
        .setDescription(
          `<@!${member.id}> has claimed **\`${result.rows.length}\` T${
            tier.num
          }s**${isTotal ? "" : " this season"}!`
        )
        .setImage(
          "https://cdn.discordapp.com/attachments/755444853084651572/769403818600300594/GACGIF.gif"
        )
        .setColor(tier.color);

      if (result.rows.length === 0) {
        embed.addField(`Recent claims:`, "``No cards claimed yet.``", true);
      } else {
        embed.addField(`Recent claims:`, toDisplay);
      }

      message.channel.send(embed);
    }

    return true;
  },
  info,
  help: {
    usage: "stats [@user] [server] [total] [T1|T2|T3|T4|T5|T6]",
    examples: ["stats t1", "stats @JeDaYoshi t6"],
    description: "Show an user's claiming stats in certain tiers.",
  },
};

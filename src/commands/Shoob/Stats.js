const { tierInfo } = require("../../utils/cardUtils");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "stats",
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6"];

module.exports = {
  execute: async (instance, message, args) => {
    const member = message.author || {};
    if (args.length === 0) {
      let tiersArray = [];
      const hugEmbed = new MessageEmbed()     
        /*.setImage(
          "https://cdn.discordapp.com/attachments/755444853084651572/769403818600300594/GACGIF.gif"
        )*/
        .setThumbnail(member.displayAvatarURL({size: 2048, dynamic: true}))
        .setColor("#f52fb3");

      const query =
        "SELECT COUNT(id) c, tier FROM CARD_CLAIMS WHERE claimed=true AND discord_id=$1 AND season=$2 GROUP BY tier";
      const result = await instance.database.pool.query(query, [
        message.author.id,
        instance.config.season,
      ]);
      result.rows.forEach((entry) => {
        const tier = tierInfo["T" + entry.tier.toUpperCase()];
          var text = `${tier.emoji} x ${entry.c}`
          tiersArray.push(text)
        /*hugEmbed.addField(
          `Tier ${entry.tier}`,
          `》${tier.emoji} ${entry.c}x`,
          true
        );*/
      });
      hugEmbed.setDescription(`<:733154673413980202:782165519146156062> **${member.username}'s claims**
━━━━━━━━━━━━━━━
${tiersArray.join(' | ')}
━━━━━━━━━━━━━━━`);
      await message.channel.send(hugEmbed);
    } else {
      if (!allowed.includes(args[0])) return false;
      const query =
        "SELECT * FROM CARD_CLAIMS WHERE discord_id=$1 AND tier=$2 AND claimed=true AND season=$3 ORDER BY id DESC";
      const result = await instance.database.pool.query(query, [
        message.author.id,
        args[0][1].toUpperCase(),
        instance.config.season,
      ]);
      const tier = tierInfo[args[0].toUpperCase()];
      const toDisplay = result.rows
        .slice(0, 5)
        .map((e) => `Issue: \`${e.issue}\` • \`${e.card_name}\``);
      const embed = new MessageEmbed()
        .setTitle(`${tier.emoji} Tier ${tier.num} Stats.`)
        .setThumbnail(member.displayAvatarURL())
        .setDescription(
          `For this season you have claimed \`${result.rows.length}\` T${tier.num}'s`
        )
        .setImage(
          "https://cdn.discordapp.com/attachments/755444853084651572/769403818600300594/GACGIF.gif"
        )
        .setColor(tier.color);

      if (result.rows.length === 0) {
        embed.addField(
          `Recently claimed T${tier.num}'s:`,
          "``No cards claimed yet.``",
          true
        );
      } else {
        embed.addField(`Recently claimed T${tier.num}'s:`, toDisplay);
      }

      message.channel.send(embed);
    }

    return true;
  },
  info,
  help: {
    usage: "stats [T1|T2|T3|T4|T5|T6]",
    examples: ["stats t1"],
    description: "Show your claiming stats in certain tiers.",
  },
};

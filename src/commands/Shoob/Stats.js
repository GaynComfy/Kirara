const { tierInfo } = require("../../utils/cardUtils");

const info = {
  name: "stats",
  matchCase: false,
  category: "Shoob",
  cooldown: 5,
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6"];

module.exports = {
  execute: async (instance, message, args) => {
    const member = message.meber || {};
    if (args.length === 0) {
      const hugEmbed = new discord.MessageEmbed()
        .setDescription(`**${member}'s stats:**`)
        .setImage(
          "https://cdn.discordapp.com/attachments/755444853084651572/769403818600300594/GACGIF.gif"
        )
        .setColor("#f52fb3");

      const query =
        "SELECT COUNT(id) c, tier FROM CARD_CLAIMS WHERE discord_id=$1 GROUP BY tier";
      const result = await instance.database.pool.query(query, [
        message.author.id,
      ]);
      result.rows.forEach((entry) => {
        const tierInfo = tierInfo[entry.tier.toUpperCase()];
        hugEmbed.addField(
          `Tier ${entry.tier}`,
          `》${tierInfo.emoji} ${entry.c}x`,
          true
        );
      });
      await message.channel.send(hugEmbed);
    } else {
      if (!allowed.includes(args[0])) return false;
      const query =
        "SELECT * FROM CARD_CLAIMS WHERE discord_id=$1 AND tier=$2 ORDER BY id DESC LIMIT 5";
      const result = await instance.database.pool.query(query, [
        message.author.id,
        args[0].toLowerCase(),
      ]);
      const tier = tierSettings[args[0].toUpperCase()];
      const toDisplay = result.rows.map(
        (e) => `Issue: \`${e.issue}\` • \`${e.card_name}\``
      );
      const embed = new discord.MessageEmbed()
        .setTitle(`${tier.emoji} Tier ${tier.num} Stats.`)
        .setThumbnail(member.displayAvatarURL())
        .setDescription(
          `For this season you have claimed \`${cards.length}\` T${tier.num}'s`
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

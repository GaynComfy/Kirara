const { EmbedBuilder } = require("discord.js");
const humanizeDuration = require("humanize-duration");
const { mention, userId } = require("../../utils/regexUtils");
const info = {
  name: "nitro",
  aliases: ["boost"],
  matchCase: false,
  category: "UwU",
  cooldown: 2,
};

module.exports = {
  execute: async (instance, message, args) => {
    let account =
      message.mentions.members.first() ||
      (args.length >= 1 &&
        userId.test(args[0]) &&
        (await message.guild.members.fetch(args[0]).catch(() => null)));
    if (args.length >= 1 && (mention.test(args[0]) || userId.test(args[0])))
      args.shift();
    if (!account) {
      account = message.member;
    }
    const mem = account.user;

    const embed = new EmbedBuilder();
    if (!account.premiumSinceTimestamp) {
      embed
        .setDescription(
          `\`${account.username || mem.username}\` is not boosting this server`
        )
        .setColor("#ff0000");
    } else {
      const since = humanizeDuration(
        Date.now() - account.premiumSinceTimestamp,
        { round: true, units: ["y", "mo", "w", "d", "h", "m"] }
      );

      embed
        .setDescription(
          `\`${mem.username}\` has been boosting this server for \`${since}\``
        )
        .setColor("#e444f2");
    }

    await message.channel.send({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "nitro <@user>",
    examples: ["nitro @Alycans"],
    description: "Show the time an user has been Nitro Boosting!",
  },
};

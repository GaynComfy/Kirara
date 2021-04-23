const { MessageEmbed } = require("discord.js");
const humanizeDuration = require("humanize-duration");

const info = {
  name: "nitro",
  aliases: ["boost"],
  matchCase: false,
  category: "UwU",
  cooldown: 2,
};
const mention = /<@!?(\d{17,19})>/;
const userId = /\d{17,19}/;

module.exports = {
  execute: async (instance, message, args) => {
    let account =
      message.mentions.members.first() ||
      (args.length >= 1 &&
        userId.test(args[0]) &&
        (await message.guild.members.fetch(args[0]).catch(() => {})));
    if (args.length >= 1 && (mention.test(args[0]) || userId.test(args[0])))
      args.shift();
    if (!account) {
      account = message.member;
    }
    const mem = account.user;
    if (!account.premiumSinceTimestamp) {
      const embed = new MessageEmbed()
        .setDescription(
          `\`${account.username || mem.username}\` is not boosting this server`
        )
        .setColor("#FF0000");

      message.channel.send({ embed: embed });
    } else {
      const since = humanizeDuration(
        Date.now() - account.premiumSinceTimestamp,
        { round: true, units: ["y", "mo", "w", "d", "h", "m"] }
      );

      const embed = new MessageEmbed()
        .setDescription(
          `\`${mem.username}\` has been boosting this server for \`${since}\``
        )
        .setColor("#e444f2");
      message.channel.send({ embed: embed });
    }
  },
  info,
  help: {
    usage: "nitro <@user>",
    examples: ["nitro @Alycans"],
    description: "Show the time an user has been Nitro Boosting!",
  },
};

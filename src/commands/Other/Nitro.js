const { MessageEmbed } = require("discord.js");
const humanizeDuration = require("humanize-duration");

const info = {
  name: "nitro",
  matchCase: false,
  category: "UwU",
  cooldown: 2,
};

module.exports = {
  execute: async (instance, message, args) => {
    const target = message.mentions.users.first() || message.member;
    const account = message.guild.members.cache.get(target.id);
    const mem = account.user;
    if (!account.premiumSinceTimestamp) {
      const embed = new MessageEmbed()
        .setDescription(
          `\`${target.username || mem.username}\` is not boosting this server`
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
    usage: "Nitro",
    examples: ["nitro", "nitro @Kirara"],
    description: "Show User Nitro!",
  },
};

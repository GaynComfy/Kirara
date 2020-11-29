const { MessageEmbed } = require("discord.js");

const info = {
  name: "avatar",
  aliases: ["av"],
  matchCase: false,
  category: "UwU",
  cooldown: 60,
};

module.exports = {
  execute: async (instance, message, args) => {
    const target = message.mentions.users.first() || message.author;

    // Embed

    const embed = new MessageEmbed()
      .setTitle(target.tag + "'s avatar")
      .setDescription(
        `[PNG](${
          target.displayAvatarURL({ format: "png" }) + "?size=2048"
        }) | [JPG](${
          target.displayAvatarURL({ format: "jpg" }) + "?size=2048"
        })`
      )
      .setColor("RANDOM")
      .setImage(
        target.displayAvatarURL({ format: "png", dynamic: true }) + "?size=2048"
      );
    message.channel.send(embed);
  },
  info,
  help: {
    usage: "avatar <@user>",
    examples: ["avatar @JeDaYoshi"],
    description: "Show User Avatar!",
  },
};

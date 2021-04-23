const { MessageEmbed } = require("discord.js");

const info = {
  name: "avatar",
  aliases: ["av"],
  matchCase: false,
  category: "UwU",
  cooldown: 60,
};
const mention = /<@!?(\d{17,19})>/;
const userId = /\d{17,19}/;

module.exports = {
  execute: async (instance, message, args) => {
    let target =
      message.mentions.users.first() ||
      (args.length >= 1 &&
        userId.test(args[0]) &&
        (await instance.client.users.fetch(args[0]).catch(() => {})));
    if (args.length >= 1 && (mention.test(args[0]) || userId.test(args[0])))
      args.shift();
    if (!target) {
      target = message.author;
    }

    // Embed

    const embed = new MessageEmbed()
      .setTitle(target.tag + "'s avatar")
      .setDescription(
        `[PNG](${target.displayAvatarURL({
          format: "png",
          size: 4096,
        })}) | [JPG](${target.displayAvatarURL({ format: "jpg", size: 4096 })})`
      )
      .setColor("RANDOM")
      .setImage(target.displayAvatarURL({ dynamic: true, size: 4096 }));
    message.channel.send(embed);
  },
  info,
  help: {
    usage: "avatar <@user>",
    examples: ["avatar @JeDaYoshi"],
    description: "Show User Avatar!",
  },
};

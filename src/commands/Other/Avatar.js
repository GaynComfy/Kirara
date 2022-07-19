const { EmbedBuilder } = require("discord.js");

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
        (await instance.client.users.fetch(args[0]).catch(() => null)));
    if (args.length >= 1 && (mention.test(args[0]) || userId.test(args[0])))
      args.shift();
    if (!target) {
      target = message.author;
    }

    // Embed
    const embed = new EmbedBuilder()
      .setTitle(`${target.tag}'s avatar`)
      .setDescription(
        `[PNG](${target.displayAvatarURL({
          extension: "png",
          size: 4096,
        })}) | [JPG](${target.displayAvatarURL({
          extension: "jpg",
          size: 4096,
        })}) | [WEBP](${target.displayAvatarURL({
          extension: "webp",
          size: 4096,
        })})` +
          (target.avatar.startsWith("a_")
            ? ` | [GIF](${target.displayAvatarURL({
                extension: "gif",
                size: 4096,
              })})`
            : "")
      )
      .setColor("Random")
      .setImage(target.displayAvatarURL({ size: 4096 }));
    await message.channel.send({ embeds: [embed] });
  },
  info,
  help: {
    usage: "avatar <@user>",
    examples: ["avatar @JeDaYoshi"],
    description: "Show someone's avatar!",
  },
};

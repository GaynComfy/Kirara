const { EmbedBuilder } = require("discord.js");

const info = {
  name: "avatar",
  aliases: ["av"],
  matchCase: false,
  category: "UwU",
  cooldown: 60,
};
//const mention = /<@!?(\d{17,19})>/;
//const userId = /\d{17,19}/;

const getTarget = async (instance, message, args) => {
  const target =
    message.mentions.users[0] ||
    (args.length ? await instance.client.users.fetch(args[0]) : message.author);
  if (message.guild) {
    const guildMember = await message.guild.members.fetch(target.id);
    if (guildMember) {
      if (guildMember.displayAvatarURL().length) return [guildMember, target];
    }
  }
  return [target];
};
module.exports = {
  execute: async (instance, message, args) => {
    const targets = await getTarget(instance, message, args);
    // Embed
    const embeds = targets.map(target =>
      new EmbedBuilder()
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
        .setImage(target.displayAvatarURL({ size: 4096 }))
    );
    await message.channel.send({ embeds });
  },
  info,
  help: {
    usage: "avatar <@user>",
    examples: ["avatar @JeDaYoshi"],
    description: "Show someone's avatar!",
  },
};

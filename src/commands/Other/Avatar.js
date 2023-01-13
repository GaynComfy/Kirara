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

const getTargets = async (instance, message, args) => {
  const target =
    message.mentions.users.first() ||
    (args.length ? await instance.client.users.fetch(args[0]) : message.author);
  const targets = [target];
  if (message.guild) {
    const guildMember = await message.guild.members.fetch(target.id);
    if (guildMember) {
      if (
        guildMember.displayAvatarURL().length &&
        guildMember.displayAvatarURL() !== target.displayAvatarURL()
      )
        targets.push(guildMember);
    }
  }
  return targets;
};
module.exports = {
  execute: async (instance, message, args) => {
    const targets = await getTargets(instance, message, args);
    message.channel.send(`${targets.length} ${targets[0].displayAvatarURL()}`);
    // Embed
    const embeds = targets.map(target =>
      new EmbedBuilder()
        .setTitle(`${target.tag ? target.tag : target.user.tag}'s avatar`)
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

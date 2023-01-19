const { EmbedBuilder } = require("discord.js");

const info = {
  name: "avatar",
  aliases: ["av"],
  matchCase: false,
  category: "UwU",
  cooldown: 60,
  slashSupport: true,
  ephemeral: true,
};
//const mention = /<@!?(\d{17,19})>/;
//const userId = /\d{17,19}/;

const getTargets = async (instance, message, args) => {
  const sendGlobal = args.includes("global") || args.includes("g");
  const target =
    message.mentions.users.first() ||
    (args.length ? await instance.client.users.fetch(args[0]) : message.author);
  if (sendGlobal) return [target];
  if (message.guild) {
    const guildMember = await message.guild.members.fetch(target.id);
    if (guildMember && guildMember.avatar) {
      return [guildMember];
    }
  }
  return [target];
};
module.exports = {
  execute: async (instance, message, args) => {
    const targets = await getTargets(instance, message, args);
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
    return true;
  },
  info,
  arguments: [
    {
      type: "user",
      name: "user",
      description: "The user to fetch the avatar of",
      required: true,
    },
    {
      type: "boolean",
      name: "global",
      description: "Fetch the users global avatar",
      required: false,
      prio: true,
    },
  ],
  help: {
    usage: "avatar [global] [@user]",
    examples: ["avatar", "avatar @JeDaYoshi", "avatar g @Alycans"],
    description: "Show someone's avatar!",
  },
};

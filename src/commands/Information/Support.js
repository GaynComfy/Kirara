const { MessageEmbed } = require("discord.js");

const info = {
  name: "support",
  matchCase: false,
  category: "Information",
  cooldown: 60,
};
const InviteEmbed = new MessageEmbed()
  .setAuthor(
    "Kirara",
    "https://cdn.discordapp.com/avatars/748100524246564894/03cfa9d81490e748b10e26d37a197525.png?size=2048"
  )
  .setDescription(
    "Want more help or want to report bugs?\n> [__**Click Me**__](https://discord.gg/comfy) and [__**Click Me**__](https://discord.gg/GU9USZR4M2) for more support!"
  )
  .setFooter("by G&C Dev Team | Use s!invite to invite the bot!")
  .setColor("RANDOM");

module.exports = {
  execute: async (instance, message, args) => {
    message.channel.send(InviteEmbed);
  },
  info,
  help: {
    usage: "support",
    examples: ["suport"],
    description: "Join the Support server!",
  },
};

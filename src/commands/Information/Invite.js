const { MessageEmbed } = require("discord.js");

const info = {
  name: "invite",
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
    "<:T6:754541597479403612> Want to invite the bot to your server? **[Click Me](https://discord.com/oauth2/authorize?client_id=748100524246564894&permissions=8&scope=bot)**"
  )
  .setColor("RANDOM");

module.exports = {
  execute: async (instance, message, args) => {
    message.channel.send(InviteEmbed);
  },
  info,
  help: {
    usage: "invite",
    examples: ["invite"],
    description: "Invite this awesome bot to other servers!",
  },
};

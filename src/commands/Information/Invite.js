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
    "https://cdn.comfy.gay/a/kMjAyMC0wMQ.png"
  )
  .setDescription(
    "<:T6:754541597479403612> Want to invite the bot to your server? **[Click Me](https://discord.com/oauth2/authorize?client_id=748100524246564894&permissions=511040&scope=bot)**"
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

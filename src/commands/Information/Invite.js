const { MessageEmbed } = require("discord.js");

const info = {
  name: "invite",
  matchCase: false,
  category: "Information",
};
const InviteEmbed = new MessageEmbed()
  .setAuthor("Kirara", "https://cdn.comfy.gay/a/kMjAyMC0wMQ.png")
  .setDescription(
    "<:Flame:783439293506519101> Want to invite the bot to your server? " +
      "**[Click me!](https://discord.com/oauth2/authorize?client_id=748100524246564894&permissions=511040&scope=bot)**"
  )
  .setColor("#570489");

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

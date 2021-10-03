const { MessageEmbed } = require("discord.js");
const Constants = require("../../utils/Constants.json");

const embed = new MessageEmbed()
  .setAuthor(Constants.name, Constants.avatar)
  .setColor(Constants.color)
  .setDescription(
    "<:Flame:783439293506519101> Want to invite the bot to your server? " +
      "**[Click me!](https://discord.com/oauth2/authorize?client_id=748100524246564894&permissions=519232&scope=bot)**"
  );

const info = {
  name: "invite",
  matchCase: false,
  category: "Information",
  usage: "invite",
  examples: ["invite"],
  description: "Invite this awesome bot to other servers!",
};
module.exports = {
  execute: async (instance, message) => message.channel.send(embed),
  info,
};

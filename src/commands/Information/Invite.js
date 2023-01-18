const { EmbedBuilder } = require("discord.js");
const Constants = require("../../utils/Constants.json");

const embed = new EmbedBuilder()
  .setAuthor({
    name: Constants.name,
    iconURL: Constants.avatar,
  })
  .setColor(Constants.color)
  .setDescription(
    "<:Flame:783439293506519101> Want to invite the bot to your server? " +
      "**[Click me!](https://discord.com/oauth2/authorize?client_id=748100524246564894&permissions=415001603136&scope=bot)**"
  );

const info = {
  name: "invite",
  matchCase: false,
  category: "Information",
};
module.exports = {
  execute: async (instance, message) => {
    await message.channel.send({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "invite",
    examples: ["invite"],
    description: "Invite this awesome bot to other servers!",
  },
};

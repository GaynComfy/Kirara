const { EmbedBuilder } = require("discord.js");
const Constants = require("../../utils/Constants.json");

const embed = new EmbedBuilder()
  .setAuthor({
    name: Constants.name,
    iconURL: Constants.avatar,
  })
  .setColor(Constants.color)
  .setDescription(
    "Having any issues, need help, or want to report bugs?\n" +
      "> ❕ Join [__**Gay & Comfy**__](https://discord.gg/comfy) for support!\n" +
      "> ❕ Then, DM `DreiMail#4085` explaining the situation!"
  );

const info = {
  name: "support",
  matchCase: false,
  category: "Information",
};
module.exports = {
  execute: async (instance, message) =>
    message.channel.send({ embeds: [embed] }),
  info,
  help: {
    usage: "support",
    examples: ["support"],
    description: "Join the Support server!",
  },
};

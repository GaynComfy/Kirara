const { MessageEmbed } = require("discord.js");
const Constants = require("../../utils/Constants.json");

const embed = new MessageEmbed()
  .setAuthor(Constants.name, Constants.avatar)
  .setColor(Constants.color)
  .setDescription(
    "Having any issues or want to report bugs?\n" +
      "> Join [__**Gay & Comfy**__](https://discord.gg/comfy) for support!\n" +
      "> DM `Sirona-Kirara Support#8123` explaining the situation!"
  );

const info = {
  name: "support",
  matchCase: false,
  category: "Information",
};
module.exports = {
  execute: async (instance, message) => message.channel.send(embed),
  info,
  help: {
    usage: "support",
    examples: ["support"],
    description: "Join the Support server!",
  },
};

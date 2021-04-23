const { MessageEmbed } = require("discord.js");
const info = {
  name: "uwu",
  matchCase: false,
  category: "UwU",
};
const embed = new MessageEmbed().setDescription("UwU").setColor("RANDOM");
module.exports = {
  execute: async (instance, message) => {
    message.delete().catch(() => {});
    message.channel.send({ embed: embed });
  },
  info,
  help: {
    usage: "uwu",
    examples: ["uwu"],
    description: "UwU!",
  },
};

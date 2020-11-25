const { MessageEmbed } = require("discord.js");
const info = {
  name: "uwu",
  matchCase: false,
  category: "UwU",
};
const embed = new MessageEmbed().setDescription("UwU").setColor("RANDOM");
module.exports = {
  execute: async (instance, message, args) => {
    message.channel.send({ embed: embed });
    message.delete();
  },
  info,
  help: {
    usage: "uwu",
    examples: ["uwu"],
    description: "UwU!",
  },
};

const { MessageEmbed } = require("discord.js");

const info = {
  name: "uwu",
  matchCase: false,
  category: "UwU",
  perms: ["MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
  disabled: process.env.NODE_ENV !== "development",
  usage: "uwu",
  examples: ["uwu"],
  description: "UwU!",
};
module.exports = {
  execute: async (instance, message) => {
    message.delete().catch(() => {});
    const embed = new MessageEmbed().setDescription("UwU").setColor("RANDOM");
    return message.channel.send({ embeds: [embed] });
  },
  info,
};

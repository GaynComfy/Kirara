const { EmbedBuilder } = require("discord.js");

const info = {
  name: "uwu",
  matchCase: false,
  category: "UwU",
  perms: ["MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
  disabled: process.env.NODE_ENV !== "development",
};
module.exports = {
  execute: async (instance, message) => {
    message.delete().catch(() => null);
    const embed = new EmbedBuilder().setDescription("UwU").setColor("RANDOM");
    return message.channel.send({ embeds: [embed] });
  },
  info,
  help: {
    usage: "uwu",
    examples: ["uwu"],
    description: "UwU!",
  },
};

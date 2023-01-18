const { EmbedBuilder } = require("discord.js");

const info = {
  name: "uwu",
  matchCase: false,
  category: "UwU",
  perms: ["ManageMessages", "ReadMessageHistory"],
  disabled: process.env.NODE_ENV !== "development",
};
module.exports = {
  execute: async (instance, message) => {
    message.delete().catch(() => null);
    const embed = new EmbedBuilder().setDescription("UwU").setColor("Random");
    await message.channel.send({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "uwu",
    examples: ["uwu"],
    description: "UwU!",
  },
};

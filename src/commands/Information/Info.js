const { MessageEmbed } = require("discord.js");

const info = {
  name: "info",
  matchCase: false,
  category: "Information",
};

const embed = new MessageEmbed()
  .setAuthor("Kirara", "https://cdn.comfy.gay/a/kMjAyMC0wMQ.png")
  .setColor("#570489")
  .setDescription(
    "Multi-purpose bot for Shoob activities with extras! Completely free with no restrictions. " +
      "Part of [__**Gay & Comfy**__](https://discord.gg/comfy)!"
  )
  .addField("Owners:", "`Nota#1576`, `🎀 𝒥𝑜𝓇𝑔𝓎 🎀#2024`, `Alycans#1693`")
  .addField("Lead Dev:", "`JeDaYoshi#7942`")
  .addField(
    "Team and Collaborators:",
    "`JeDaYoshi#7942`, `Liz3#0001`, `🎀 𝒥𝑜𝓇𝑔𝓎 🎀#2024`, `Nota#1576`, " +
      "`Shiro~#0666`, `offbeatwitch#8860`, `Riku#1111`, `Tranuka#4474`"
  )
  .setFooter("Roleplay images provided by https://waifu.pics");

module.exports = {
  execute: async (instance, message) => message.channel.send(embed),
  info,
  help: {
    usage: "info",
    examples: ["info"],
    description: "Bot info!",
  },
};

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
    "Multi-purpose bot for Shoob activities and extras! Completely free with no restrictions. " +
      "Also partnered with [__**Gay & Comfy**__](https://discord.gg/comfy)!"
  )
  .addField("Owner:", "`Nota#1576`")
  .addField("Co-Owner:", "`🎀 𝒥𝑜𝓇𝑔𝓎 🎀#2024`, `Alycans#1693`")
  .addField(
    "Main Devs:",
    "`JeDaYoshi#7942`, `offbeatwitch#8860`, `Liz3#0001`, `🎀 𝒥𝑜𝓇𝑔𝓎 🎀#2024`, `Nota#1576`"
  )
  .addField(
    "All Devs:",
    "`Boxu#0001`, `JeDaYoshi#7942`, `offbeatwitch#8860`, `Liz3#0001`, " +
      "`🎀 𝒥𝑜𝓇𝑔𝓎 🎀#2024`, `Nota#1576`, `Riku#1111`, `Tranuka#4474`, `rjt#2336`"
  );

module.exports = {
  execute: async (instance, message, args) => {
    message.channel.send(embed);
  },
  info,
  help: {
    usage: "info",
    examples: ["info"],
    description: "Bot info!",
  },
};

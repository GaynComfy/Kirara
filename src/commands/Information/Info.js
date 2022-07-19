const { EmbedBuilder } = require("discord.js");
const Constants = require("../../utils/Constants.json");

const embed = new EmbedBuilder()
  .setAuthor({
    name: Constants.name,
    iconURL: Constants.avatar,
  })
  .setColor(Constants.color)
  .setDescription(
    "Multi-purpose bot for Shoob activities with extras! Completely free with no restrictions. " +
      "Part of [__**Gay & Comfy**__](https://discord.gg/comfy)!"
  )
  .addFields([
    {
      name: "Owners:",
      value: "`Nota#8888`, `⋆˚🌺⃤ Jorgy₊ ˚#5611`, `Alycans#1693`",
    },
    {
      name: "Lead Dev:",
      value: "[`JeDaYoshi#7942`](https://jeda.im)",
    },
    {
      name: "Team and Collaborators:",
      value: "`Liz3#0001`, `⋆˚🌺⃤ Jorgy₊ ˚#5611`, `Nota#8888`, `bappy#3311`",
    },
  ])
  .setFooter({ text: "Roleplay images provided by https://waifu.pics" });

const info = {
  name: "info",
  matchCase: false,
  category: "Information",
};
module.exports = {
  execute: async (instance, message) =>
    message.channel.send({ embeds: [embed] }),
  info,
  help: {
    usage: "info",
    examples: ["info"],
    description: "Bot info!",
  },
};

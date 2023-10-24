const { EmbedBuilder } = require("discord.js");
const Constants = require("../../utils/Constants.json");

const embed = new EmbedBuilder()
  .setAuthor({
    name: Constants.name,
    iconURL: Constants.avatar,
  })
  .setColor(Constants.color)
  .setDescription(
    "Multi-purpose helper bot for game bots with extras!\n" +
      "Completely free with no restrictions. Part of [__**Gay & Comfy**__](https://discord.gg/comfy)!\n"
  )
  .addFields([
    {
      name: "Owners",
      value:
        "[`notaa.`](https://discord.com/users/554476322303246388), " +
        "[`jorgy.js`](https://discord.com/users/304357538101723137), " +
        "[`alycans`](https://discord.com/users/77256980288253952)",
    },
    {
      name: "Lead Devs",
      value: "[JeDaYoshi](https://jeda.im), [Liz3](https://nya.so)",
    },
    {
      name: "Team and Collaborators",
      value:
        "[`jedayoshi`](https://discord.com/users/175408504427905025), " +
        "[`liz3`](https://discord.com/users/195906408561115137), " +
        "[`cassakura`](https://discord.com/users/189978735816998913), " +
        "[`jorgy.js`](https://discord.com/users/304357538101723137), " +
        "[`notaa.`](https://discord.com/users/554476322303246388)",
    },
    {
      name: "Special Thanks",
      value:
        "[`kebab___`](https://discord.com/users/933549055538249728), " +
        "[`offbeatwitch`](https://discord.com/users/97707213690249216), " +
        "[`jsh32`](https://discord.com/users/462828548080664577)",
    },
  ])
  .setFooter({ text: "Roleplay images provided by https://waifu.pics" });

const info = {
  name: "info",
  matchCase: false,
  category: "Information",
};
module.exports = {
  execute: async (instance, message) => {
    await message.channel.send({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "info",
    examples: ["info"],
    description: "Bot info!",
  },
};

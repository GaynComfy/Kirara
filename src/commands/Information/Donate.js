const { EmbedBuilder } = require("discord.js");
const Constants = require("../../utils/Constants.json");

const info = {
  name: "donate",
  matchCase: false,
  category: "Information",
};
module.exports = {
  execute: async (instance, message) => {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: Constants.name,
        iconURL: Constants.avatar,
      })
      .setColor(Constants.color)
      .setDescription(
        "<:Flame:783439293506519101> You can donate through Tomi to help us keep working on the bot\n> Use `as!send 77256980288253952 <amount> Sirona-Kirara Donation`" +
          `\n\nhttps://donatebot.io/checkout/378599231583289346?buyer=${message.author.id} also has a donate tier for Sirona-Kirara!`
      );
    await message.reply({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "donate",
    examples: ["donate"],
    description: "Donate to the owners for more nice work!",
  },
};

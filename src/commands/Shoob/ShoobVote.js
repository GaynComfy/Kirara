const { EmbedBuilder } = require("discord.js");
const Color = require("../../utils/Colors.json");
const info = {
  name: "shoobvote",
  aliases: ["sv", "svote", "shoobv"],
  matchCase: false,
  category: "Shoob",
  disabled: process.env.NODE_ENV !== "development",
};
// This is a manual workaround until we find a way to get vote timers
const embed = new EmbedBuilder()
  .setColor(Color.pink)
  .setDescription(
    "**[Click here to vote for Shoob!](https://top.gg/bot/673362753489993749/vote)**\n\nYou will be reminded in 12 hours. If you would not like to be notified, use **as!vote** instead!"
  );

module.exports = {
  execute: async (instance, message) => {
    instance.shared["shoobv"].push({
      user: message.author.id,
      last: Date.now(),
    });
    await message.channel.send({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "shoobvote",
    examples: ["shoobvote"],
    description:
      "Information on voting for Shoob and get notified when vote timer is reset!",
  },
};

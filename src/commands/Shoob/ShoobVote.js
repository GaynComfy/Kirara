const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");
const info = {
  name: "shoobvote",
  aliases: ["sv"],
  matchCase: false,
  category: "Shoob",
  perms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
};
// This is a workaround until we find a way to get vote timers
module.exports = {
  execute: async (instance, message) => {
    if (!instance.shared["shoobv"]) instance.shared["shoobv"] = [];

    instance.shared["shoobv"].push({
      user: message.author.id,
      last: Date.now(),
    });

    const embed = new MessageEmbed()
      .setColor(Color.pink)
      .setDescription(
        `**Link to vote for Shoob:**\n**https://top.gg/bot/673362753489993749/vote**\n\nYou will be reminded in 12 hours. If you would not like to be notified, use **as!vote** instead!`
      );
    await message.channel.send({ embeds: [embed] });
  },
  info,
  help: {
    usage: "shoobvote",
    examples: ["shoobvote"],
    description:
      "Information on voting for Shoob and get notified when vote timer is reset!",
  },
};

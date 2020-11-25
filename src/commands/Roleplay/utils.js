const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");

exports.generateRolePlayEmbed = (sentence, from, to) => {
  return new MessageEmbed()
    .setDescription(`**${from}** ${sentence} **${to}**!`)
    .setColor(Color.white);
};

const { EmbedBuilder } = require("discord.js");
const Color = require("../../utils/Colors.json");

exports.generateRolePlayEmbed = (sentence, from, to) => {
  return new EmbedBuilder()
    .setDescription(`**<@!${from}>** ${sentence} **<@!${to}>**!`)
    .setColor(Color.white);
};

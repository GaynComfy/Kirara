const Color = require("./Colors.json");
const { MessageEmbed } = require("discord.js");
module.exports = async (channel, info) => {
  const embed = new MessageEmbed()
    .setDescription(`<:NoCross:732292174254833725> Wrong command usage`)
    .setColor(Color.red)
    .addField("Description", info.description, true)
    .addField("Usage", info.usage);
  channel.send(embed);
};

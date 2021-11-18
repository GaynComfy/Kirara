const Color = require("./Colors.json");
const { MessageEmbed } = require("discord.js");

const embed = new MessageEmbed()
  .setDescription(
    "<:Sirona_NoCross:762606114444935168> An unexpected error has occurred on command execution."
  )
  .setColor(Color.red);

module.exports = async channel => {
  channel.send({ embeds: [embed] }).catch(() => {}); // ignore, might be a channel without permissions
};

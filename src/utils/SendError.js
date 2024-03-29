const Color = require("./Colors.json");
const { EmbedBuilder } = require("discord.js");

const embed = new EmbedBuilder()
  .setDescription(
    "<:Sirona_NoCross:762606114444935168> An unexpected error has occurred on command execution."
  )
  .setColor(Color.red);

module.exports = async channel => {
  channel.send({ embeds: [embed] }).catch(() => null); // ignore, might be a channel without permissions
};

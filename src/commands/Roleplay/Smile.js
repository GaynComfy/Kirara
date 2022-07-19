const Fetcher = require("../../utils/GifFetcher");
const Color = require("../../utils/Colors.json");
const { EmbedBuilder } = require("discord.js");
const info = {
  name: "smile",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
};
module.exports = {
  execute: async (instance, message) => {
    const { url } = await Fetcher.request("smile", message.channel.id);
    const mention = message.mentions.users.first();
    const embed = new EmbedBuilder()
      .setDescription(
        mention
          ? `**<@!${message.author.id}>** smiles to **<@!${mention.id}>**!`
          : `**<@!${message.author.id}>** smiles!`
      )
      .setColor(Color.white);
    if (
      instance.settings[message.guild.id][`roleplay_size:${message.channel.id}`]
    )
      embed.setThumbnail(url);
    else embed.setImage(url);

    message.channel.send({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "smile [@user]",
    examples: ["smile", "smile @~Nota~"],
    description: "Smiles!",
  },
};

const Fetcher = require("../../utils/GifFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const info = {
  name: "smile",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
  usage: "smile [@user]",
  examples: ["smile", "smile @~Nota~"],
  description: "Smiles!",
};
module.exports = {
  execute: async (instance, message) => {
    const { url } = await Fetcher.request("smile");
    const mention = message.mentions.users.first();
    const embed = new MessageEmbed()
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

    message.channel.send(embed);
    return true;
  },
  info,
};

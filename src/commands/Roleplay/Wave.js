const Fetcher = require("../../utils/GifFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const info = {
  name: "wave",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
  usage: "wave [@user]",
  examples: ["wave", "wave @~Nota~"],
  description: "Waves!",
};
module.exports = {
  execute: async (instance, message) => {
    const { url } = await Fetcher.request("wave");
    const mention = message.mentions.users.first();
    const embed = new MessageEmbed()
      .setDescription(
        mention
          ? `**<@!${message.author.id}>** waves to **<@!${mention.id}>**!`
          : `**<@!${message.author.id}>** waves!`
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
};

const Fetcher = require("../../utils/GifFetcher");
const { MessageEmbed } = require("discord.js");
const info = {
  name: "wave",
  matchCase: false,
  category: "Roleplay",
  cooldown: 10,
};
module.exports = {
  execute: async (instance, message, args) => {
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

    message.channel.send(embed);
    return true;
  },
  info,
  help: {
    usage: "wave [@user]",
    examples: ["wave", "wave @~Nota~"],
    description: "Waves!",
  },
};

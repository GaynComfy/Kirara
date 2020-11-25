const Fetcher = require("../../utils/GifFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");
const info = {
  name: "hug",
  aliases: ["huggies"],
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.length === 0) {
      const embed = new MessageEmbed()
        .setDescription(
          "<:NoCross:732292174254833725> Mention Someone you Want to Hug!"
        )
        .setColor(Color.red);
      message.channel.send(embed);
      return;
    }

    const { url } = await Fetcher.getHug();
    const hugEmbed = new MessageEmbed()
      .setDescription(
        `**${message.author.username}** hugged **${
          message.mentions.users.first().username
        }**!`
      )
      .setImage(url)
      .setColor(Color.white);

    message.channel.send(hugEmbed);
  },
  info,
  help: {
    info: "idk need to figure this out",
  },
};

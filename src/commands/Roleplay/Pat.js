const Fetcher = require("../../utils/GifFetcher");
const Color = require("../../utils/Colors.json");
const { MessageEmbed } = require("discord.js");

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
    const { url } = await Fetcher.getPat();
    const hugEmbed = new MessageEmbed()
      .setDescription(
        `**${message.author.username}** pats **${
          message.mentions.users.first().username
        }**!`
      )
      .setImage(url)
      .setColor(Color.white);

    message.channel.send(hugEmbed);
  },
  info: {
    name: "pat",
    aliases: ["pats"],
    matchCase: false,
    category: "Roleplay",
  },
  help: {
    info: "idk need to figure this out",
  },
};

const { MessageEmbed } = require("discord.js");
const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks");
const Color = require("../../utils/Colors.json");
const info = {
  name: "neko",
  matchCase: false,
  category: "Roleplay",
  cooldown: 5,
};
module.exports = {
  execute: async (instance, message, args) => {
    const { url } = await Fetcher.request("neko");
    const embed = new MessageEmbed()
      .setDescription("Nyaa~")
      .setColor(Color.white);
    if (
      instance.settings[message.guild.id][`roleplay_size:${message.channel.id}`]
    )
      embed.setThumbnail(url);
    else embed.setImage(url);
    await message.channel.send(embed);
    return true;
  },
  info,
  help: {
    usage: "neko",
    examples: ["neko"],
    description: "Posts a cuke neko",
  },
};

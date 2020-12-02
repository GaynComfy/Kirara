const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const info = {
  name: "highfive",
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("highfive");
    const embed = generateRolePlayEmbed(
      "highfives",
      message.author.id,
      message.mentions.users.first().id
    );
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
    usage: "highfive <@user>",
    examples: ["highfive @~Nota~"],
    description: "Highfives a user",
  },
};
const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "highfive",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
  usage: "highfive <@user>",
  examples: ["highfive @~Nota~"],
  description: "Highfives a user",
};
module.exports = {
  execute: async (instance, message) => {
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
    withCount(
      instance,
      "highfive",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter(
          `${message.author.username} gave others ${send} highfives and received ${received} highfives`
        );
        message.channel.send(embed);
      }
    );

    return true;
  },
  info,
};

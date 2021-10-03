const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "bite",
  aliases: ["nom"],
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
  usage: "bite <@user>",
  examples: ["bite @~Nota~"],
  description: "Bites a user",
};
module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("bite");
    const embed = generateRolePlayEmbed(
      "bites",
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
      "bite",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter(
          `${message.author.username} bite others ${send} times and got bitten ${received} times`
        );
        message.channel.send(embed);
      }
    );

    return true;
  },
  info,
};

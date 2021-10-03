const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "hug",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
  usage: "hug <@user>",
  examples: ["hug @~Nota~"],
  description: "Hugs a user",
};
module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("hug");
    const embed = generateRolePlayEmbed(
      "hugged",
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
      "hug",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter(
          `${message.author.username} gave others ${send} hugs and received ${received} hugs`
        );
        message.channel.send(embed);
      }
    );
    return true;
  },
  info,
};

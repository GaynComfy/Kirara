const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "kiss",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
  usage: "kiss <@user>",
  examples: ["kiss @~Nota~"],
  description: "Kisses a user",
};
module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("kiss");
    const embed = generateRolePlayEmbed(
      "kisses",
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
      "kiss",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter(
          `${message.author.username} gave others ${send} kisses and received ${received} kisses`
        );
        message.channel.send(embed);
      }
    );

    return true;
  },
  info,
};

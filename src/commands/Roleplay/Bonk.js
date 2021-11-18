const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "bonk",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
  usage: "bonk <@user>",
  examples: ["bonk @Alycans"],
  description: "Bonks a user",
};
module.exports = {
  execute: async (instance, message) => {
    if (
      message.mentions.users.size === 0 ||
      message.mentions.users.first().id === "748100524246564894"
    ) {
      return false;
    }
    const { url } = await Fetcher.request("bonk");
    const embed = generateRolePlayEmbed(
      "bonks",
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
      "bonk",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter(
          `${message.author.username} bonked others ${send} times and got ${received} bonks`
        );
        message.channel.send({ embeds: [embed] });
      }
    );

    return true;
  },
  info,
};

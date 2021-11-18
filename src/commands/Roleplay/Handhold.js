const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "handhold",
  aliases: ["sex"],
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
  usage: "handhold <@user>",
  examples: ["handhold @Alycans"],
  description: "Handholds a user",
};
module.exports = {
  execute: async (instance, message) => {
    if (
      message.mentions.users.size === 0 ||
      (message.mentions.users.first().id === "445192864654295050" &&
        message.author.id !== "175408504427905025")
    ) {
      return false;
    }
    const { url } = await Fetcher.request("handhold");
    const embed = generateRolePlayEmbed(
      "holds hands with",
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
      "handhold",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter(
          `${message.author.username} handholded others ${send} times and received ${received} handholds`
        );
        message.channel.send({ embeds: [embed] });
      }
    );

    return true;
  },
  info,
};

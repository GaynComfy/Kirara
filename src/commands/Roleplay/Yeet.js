const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed, withCount } = require("./utils");
const info = {
  name: "yeet",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
};
module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("yeet", message.channel.id);
    const embed = generateRolePlayEmbed(
      "yeets",
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
      "yeet",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter({
          text: `${message.author.username} yeeted others ${send} times and received ${received} yeets`,
        });
        message.channel.send({ embeds: [embed] });
      }
    );

    return true;
  },
  info,
  help: {
    usage: "yeet <@user>",
    examples: ["yeet @~Nota~"],
    description: "Yeets a user",
  },
};

const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed, withCount } = require("./utils");
const info = {
  name: "slap",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
};
module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("slap", message.channel.id);
    const embed = generateRolePlayEmbed(
      "slaps",
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
      "slap",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter({
          text: `${message.author.username} slapped others ${send} times and was slapped ${received} times`,
        });
        message.channel.send({ embeds: [embed] });
      }
    );

    return true;
  },
  info,
  help: {
    usage: "slap <@user>",
    examples: ["slap @~Nota~"],
    description: "Slaps a user",
  },
};

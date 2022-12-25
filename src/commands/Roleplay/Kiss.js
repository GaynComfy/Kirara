const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed, withCount } = require("./utils");
const info = {
  name: "kiss",
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
};
module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("kiss", message.channel.id);
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
        embed.setFooter({
          text: `${message.author.username} gave others ${send} kisses and received ${received} kisses`,
        });
        message.channel.send({ embeds: [embed] });
      }
    );

    return true;
  },
  info,
  help: {
    usage: "kiss <@user>",
    examples: ["kiss @~Nota~"],
    description: "Kisses a user",
  },
};

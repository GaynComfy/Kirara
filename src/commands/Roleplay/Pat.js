const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "pat",
  matchCase: false,
  category: "Roleplay",
  cooldown: 10,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("pat");
    const embed = generateRolePlayEmbed(
      "pats",
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
      "patpat",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter(
          `${message.author.username} gave others ${send} pats and received ${received} pats`
        );
        message.channel.send(embed);
      }
    );

    return true;
  },
  info,
  help: {
    usage: "pat <@user>",
    examples: ["pat @~Nota~"],
    description: "Pats a user",
  },
};

const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "lick",
  matchCase: false,
  category: "Roleplay",
  cooldown: 10,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("lick");
    const embed = generateRolePlayEmbed(
      "licks",
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
      "lick",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter(
          `${message.author.username} licked others ${send} times and got licked ${received} times`
        );
        message.channel.send(embed);
      }
    );

    return true;
  },
  info,
  help: {
    usage: "lick <@user>",
    examples: ["lick @~Nota~"],
    description: "Licks a user",
  },
};

const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "bully",
  aliases: ["baka"],
  matchCase: false,
  category: "Roleplay",
  cooldown: 60,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("bully");
    const embed = generateRolePlayEmbed(
      "bullies",
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
      "bully",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter(
          `${message.author.username} bullied others ${send} times and was bullied ${received} times`
        );
        message.channel.send(embed);
      }
    );

    return true;
  },
  info,
  help: {
    usage: "bully <@user>",
    examples: ["bully @~Nota~"],
    description: "Insults a user",
  },
};

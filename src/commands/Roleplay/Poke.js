const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "poke",
  aliases: ["boop"],
  matchCase: false,
  category: "Roleplay",
  cooldown: 15,
};
module.exports = {
  execute: async (instance, message, args) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("poke");
    const embed = generateRolePlayEmbed(
      "pokes",
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
      "poke",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter(
          `${message.author.username} gave others ${send} pokes and was poked ${received} times`
        );
        message.channel.send(embed);
      }
    );

    return true;
  },
  info,
  help: {
    usage: "poke <@user>",
    examples: ["poke @~Nota~"],
    description: "Pokes a user",
  },
};

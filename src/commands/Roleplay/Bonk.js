const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed, withCount } = require("./utils");
const info = {
  name: "bonk",
  matchCase: false,
  slashSupport: true,
  category: "Roleplay",
  cooldown: 15,
};
module.exports = {
  execute: async (instance, message) => {
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("bonk", message.channel.id);
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
        embed.setFooter({
          text: `${message.author.username} bonked others ${send} times and got ${received} bonks`,
        });
        message.channel.send({ embeds: [embed] });
      }
    );

    return true;
  },
  info,
  arguments: [
    {
      type: "user",
      required: false,
      name: "user",
      description: "The User to bonk",
    },
    {
      type: "string",
      required: false,
      name: "str",
      description: "The String to bonk",
    },
    {
      type: "number",
      required: false,
      name: "number",
      description: "The Number to bonk",
    },
    {
      type: "channel",
      required: false,
      name: "channel",
      description: "The channel to bonk",
    },
    {
      type: "boolean",
      required: false,
      name: "bool",
      description: "The bool to bonk",
      mapping: ["e", null],
    },
  ],
  help: {
    usage: "bonk <@user>",
    examples: ["bonk @Alycans"],
    description: "Bonks a user",
  },
};

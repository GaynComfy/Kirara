const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("../Roleplay/utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
const info = {
  name: "ccuddle",
  matchCase: false,
  category: "Owner",
  cooldown: 5,
};
module.exports = {
  execute: async (instance, message) => {
    if (message.author.id !== "189978735816998913") {
      if (message.guild.id === "378599231583289346") {
        message.reply("Permission Denied: You aren't cass!");
      }
      return;
    }
    if (message.mentions.users.size === 0) {
      return false;
    }
    const { url } = await Fetcher.request("cuddle", message.channel.id);
    const embed = generateRolePlayEmbed(
      "cuddles",
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
      "cuddle",
      message.author.id,
      message.mentions.users.first().id,
      ({ send }) => {
        embed.setFooter({
          text: `I love you so much! Have a cass cuddle!\ncass used cuddle on others ${send} times, but yours is unique!`,
        });
        message.channel.send({ embeds: [embed] });
      }
    );

    return true;
  },
  info,
  help: {
    usage: "ccuddle <@user>",
    examples: ["ccuddle @Alycans"],
    description: "Cass cuddles a user. (Unique to cass)",
  },
};

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
      return message.reply("Nah you ain’t Cass homie");
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
      () => {
        embed.setFooter({
          text: "Now give me your fucking PayPal. I love you. \nNow give me your fucking PayPal. I love you. \nNow give me your fucking PayPal. I love you. \nNow give me your fucking PayPal. I love you. \nNow give me your fucking PayPal. I love you.",
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
    description: "Cuddles a user",
  },
};

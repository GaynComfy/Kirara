const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed } = require("./utils");
const { withCount } = require("../../utils/rolePlayHooks.js");
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
    if (
      message.mentions.users.first().id === "445192864654295050" &&
      message.author.id !== "175408504427905025" &&
      message.author.id !== "445192864654295050"
    ) {
      return message.reply("You are commiting war crimes. Please stop.");
    }
    if (
      message.mentions.users.first().id === "175408504427905025" &&
      message.author.id !== "445192864654295050" &&
      message.author.id !== "175408504427905025"
    ) {
      return message.reply(
        "someone will not get their egg today <:rEkomda:889128655408734269>"
      );
    }
    const { url } = await Fetcher.request("kiss");
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

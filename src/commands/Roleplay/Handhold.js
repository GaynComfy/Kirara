const Fetcher = require("../../utils/GifFetcher");
const { generateRolePlayEmbed, withCount } = require("./utils");
const info = {
  name: "handhold",
  aliases: ["<:SexHands:856140992758808576>"],
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
    if (
      message.mentions.users.first().id === "933549055538249728" &&
      message.author.id !== "510713365404975114" &&
      message.author.id !== "933549055538249728"
    ) {
      return message.reply(
        "'I told Bappy I would implement this for him' ~cass"
      );
    }
    if (
      message.mentions.users.first().id === "510713365404975114" &&
      message.author.id !== "933549055538249728" &&
      message.author.id !== "510713365404975114"
    ) {
      return message.reply(
        "'I told Bappy I would implement this for him' ~cass"
      );
    }
    const { url } = await Fetcher.request("handhold", message.channel.id);
    const embed = generateRolePlayEmbed(
      "holds hands with",
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
      "handhold",
      message.author.id,
      message.mentions.users.first().id,
      ({ send, received }) => {
        embed.setFooter({
          text: `${message.author.username} handholded others ${send} times and received ${received} handholds`,
        });
        message.channel.send({ embeds: [embed] });
      }
    );

    return true;
  },
  info,
  help: {
    usage: "handhold <@user>",
    examples: ["handhold @Alycans"],
    description: "Handholds a user",
  },
};

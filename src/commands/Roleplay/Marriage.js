const { getMarriage } = require("./utils");
const Color = require("../../utils/Colors.json");
const { EmbedBuilder } = require("discord.js");

const info = {
  name: "marriage",
  matchCase: false,
  category: "Roleplay",
  cooldown: 5,
};

module.exports = {
  execute: async (instance, message) => {
    const asker =
      message.meentions.user.size === 0
        ? message.author
        : message.mentions.users.first();

    const embed = new EmbedBuilder().setColor(Color.pink);

    const marry = await getMarriage(instance, asker.id);
    if (marry.length === 0) {
      embed
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> <@!${asker.id}> is not married to anyone!`
        )
        .setColor(Color.red);
      await message.channel.send({ embeds: [embed] });
      return;
    }

    const married = marry
      .map((m, i) => {
        if (i === marry.length - 1) {
          return `and <@!${m.user}>`;
        }
        return `<@!${m.user}>`;
      })
      .join(",");

    embed.setDescription(
      `<a:Sirona_star:748985391360507924> <@!${asker.id}> is married to ${married}`
    );
    await message.channel.send({ embeds: [embed] });
  },
  info,
  help: {
    usage: "marriage [@user]",
    examples: ["marriage", "marriage @cass"],
    description: "Check the marriage information of a user!",
  },
};

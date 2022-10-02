const { getMarriage } = require("./utils");
const { mention, userId } = require("../../utils/regexUtils");
const Color = require("../../utils/Colors.json");
const { EmbedBuilder } = require("discord.js");

const info = {
  name: "marriage",
  matchCase: false,
  category: "Roleplay",
  cooldown: 5,
};

module.exports = {
  execute: async (instance, message, args) => {
    let member =
      message.mentions.users.first() ||
      (args.length >= 1 &&
        userId.test(args[0]) &&
        (await instance.client.users.fetch(args[0]).catch(() => null)));
    if (args.length >= 1 && (mention.test(args[0]) || userId.test(args[0])))
      args.shift();
    if (!member) {
      member = message.author;
    }

    const embed = new EmbedBuilder().setColor(Color.pink);

    const marry = await getMarriage(instance, member.id);
    if (marry.length === 0) {
      embed
        .setDescription(
          `<:Sirona_NoCross:762606114444935168> <@!${member.id}> is not married to anyone!`
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
      `<a:Sirona_star:748985391360507924> <@!${member.id}> is married to ${married}`
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

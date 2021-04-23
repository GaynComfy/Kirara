const { MessageEmbed } = require("discord.js");

const info = {
  name: "donate",
  matchCase: false,
  category: "Information",
};

module.exports = {
  execute: async (instance, message) => {
    const embed = new MessageEmbed()
      .setAuthor("Kirara", "https://cdn.comfy.gay/a/kMjAyMC0wMQ.png")
      .setDescription(
        "<:Flame:783439293506519101> You can donate through Tomi to help us keep working on the bot\n> Use `as!send 77256980288253952 <amount> Sirona-Kirara Donation`" +
          `\n\nhttps://donatebot.io/checkout/378599231583289346?buyer=${message.author.id} also has a donate tier for Sirona-Kirara!`
      )
      .setColor("#570489");
    message.channel.send(embed);
  },
  info,
  help: {
    usage: "donate",
    examples: ["donate"],
    description: "Donate to the owners for more nice work!",
  },
};

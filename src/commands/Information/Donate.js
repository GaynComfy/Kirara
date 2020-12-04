const { MessageEmbed } = require("discord.js");

const info = {
  name: "donate",
  matchCase: false,
  category: "Information",
};

const InviteEmbed = new MessageEmbed()
  .setAuthor("Kirara", "https://cdn.comfy.gay/a/kMjAyMC0wMQ.png")
  .setDescription(
    "<:T6:754541597479403612> You can donate through Tomi to help us support the bot\nUsing `as!send 252947351990304770 <amount>`" +
      "\n\nhttps://donatebot.io/checkout/378599231583289346 also has a donate tier for Sirona-Kirara!"
  )
  .setColor("#570489");

module.exports = {
  execute: async (instance, message, args) => {
    message.channel.send({ embed: InviteEmbed });
  },
  info,
  help: {
    usage: "donate",
    examples: ["donate"],
    description: "Donate to the owner for more nice work!",
  },
};

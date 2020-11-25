const { MessageEmbed } = require("discord.js");

const info = {
  name: "donate",
  matchCase: false,
  category: "Information",
};

const InviteEmbed = new MessageEmbed()
  .setAuthor(
    "Kirara",
    "https://cdn.discordapp.com/avatars/748100524246564894/03cfa9d81490e748b10e26d37a197525.png?size=2048"
  )
  .setDescription(
    "<:T6:754541597479403612> You can donate through Tomi to help us support the bot\nUsing `as!send 252947351990304770 <amount>`" +
      "\n\nhttps://donatebot.io/checkout/378599231583289346 also has a donate tier for Sirona-Kirara!"
  )
  .setColor("RANDOM");

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

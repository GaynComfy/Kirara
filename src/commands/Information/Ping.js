const { MessageEmbed } = require("discord.js");

const info = {
  name: "ping",
  matchCase: false,
  category: "Information",
  cooldown: 60,
};

module.exports = {
  execute: async (instance, message, args) => {
    const InviteEmbed = new MessageEmbed()
      .setAuthor("Info for Sirona")
      .setDescription(
        `🏓Latency is ${
          Date.now() - message.createdTimestamp
        }ms. API Latency is ${Math.round(instance.client.ws.ping)}ms`
      )
      .setColor("#e0e0e0");
    message.channel.send(InviteEmbed);
  },
  info,
  help: {
    usage: "ping",
    examples: ["ping"],
    description: "Pong!",
  },
};

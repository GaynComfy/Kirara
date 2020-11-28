const { MessageEmbed } = require("discord.js");
const { getLilliePing } = require('./utils');

const info = {
  name: "ping",
  matchCase: false,
  category: "Information",
  cooldown: 60,
};

module.exports = {
  execute: async (instance, message, args) => {
    const ping = Math.round(Date.now() - message.createdTimestamp);
    const lilping = await getLilliePing();
    const InviteEmbed = new MessageEmbed()
      .setAuthor("Latency for Kirara")
      .setDescription(
        `🏓 Commands: \`${ping}ms\`\n` +
        `💓 Gateway: \`${Math.round(instance.client.ws.ping)}ms\`` +
        `🗃️ lillie: \`${lilping}\``
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

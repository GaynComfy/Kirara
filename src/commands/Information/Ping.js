const { MessageEmbed } = require("discord.js");
const { getLilliePing } = require("./utils");

const info = {
  name: "ping",
  matchCase: false,
  category: "Information",
};

module.exports = {
  execute: async (instance, message, args) => {
    const msgPing = Math.round(Date.now() - message.createdTimestamp);
    const { ping } = await getLilliePing();
    const InviteEmbed = new MessageEmbed()
      .setAuthor("Latency for Kirara")
      .setDescription(
        `🏓 Command: \`${msgPing}ms\`\n` +
          `💓 Gateway: \`${Math.round(instance.client.ws.ping)}ms\`\n` +
          `🖍️ lillie: \`${ping}\``
      )
      .setColor("#e0e0e0");
    await message.channel.send(InviteEmbed);
  },
  info,
  help: {
    usage: "ping",
    examples: ["ping"],
    description: "Pong!",
  },
};

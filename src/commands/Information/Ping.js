const { MessageEmbed } = require("discord.js");
const { getLilliePing } = require("./utils");

const info = {
  name: "ping",
  matchCase: false,
  category: "Information",
};
module.exports = {
  execute: async (instance, message) => {
    const msgPing = Date.now() - message.createdTimestamp;
    const { ping } = await getLilliePing();
    const embed = new MessageEmbed()
      .setAuthor("Latency for Kirara")
      .setDescription(
        `🏓 Command: \`${msgPing}ms\`\n` +
          `💓 Gateway: \`${instance.client.ws.ping}ms\`\n` +
          `🖍️ midori: \`${ping}\``
      )
      .setColor("#e0e0e0");
    return message.channel.send(embed);
  },
  info,
  help: {
    usage: "ping",
    examples: ["ping"],
    description: "Pong!",
  },
};

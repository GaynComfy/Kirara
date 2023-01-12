const { EmbedBuilder } = require("discord.js");
const { getMidoriPing } = require("./utils");

const info = {
  name: "ping",
  matchCase: false,
  category: "Information",
};
module.exports = {
  execute: async (instance, message) => {
    const msgPing = Date.now() - message.createdTimestamp;
    const { ping } = await getMidoriPing();
    const embed = new EmbedBuilder()
      .setAuthor({ name: "Latency for Kirara" })
      .setDescription(
        `🏓 Command: \`${msgPing}ms\`\n` +
          `💓 Gateway: \`${instance.client.ws.ping}ms\`\n` +
          `🖍️ midori: \`${ping}\`\nTest here`
      )
      .setColor("#e0e0e0");
    return message.channel.send({ embeds: [embed] });
  },
  info,
  help: {
    usage: "ping",
    examples: ["ping"],
    description: "Pong!",
  },
};

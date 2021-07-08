const { tierInfo } = require("../utils/cardUtils");
module.exports = {
  execute: async (instance, message) => {
    if (
      message.author.id !== "673362753489993749" &&
      message.author.id !== instance.client.user.id
    ) {
      return;
    }
    for (const embed of message.embeds) {
      const word = embed.description;
      if (!word || !word.startsWith("To claim, ")) continue;

      const tieri = Object.values(tierInfo).find(
        t => t.color === embed.hexColor
      );
      if (!tieri) return;
      const tier = tieri.num.toString();
      const name = embed.title.split(" Tier: ")[0];

      const result = await instance.database.simpleQuery("CARD_ROLES", {
        tier: `t${tier}`,
        server_id: instance.serverIds[message.guild.id],
      });
      if (result.rows.length === 1) {
        await message.channel.send(
          `${tieri.emoji} <@&${result.rows[0].role_id}> | \`${name} T${tier} has spawned!\``
        );
      }
    }
  },
  eventName: "_disabled_message",
};

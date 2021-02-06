const { tierInfo } = require("../utils/cardUtils");
const allowed = ["3", "4", "5", "6"];
module.exports = {
  execute: async (instance, message) => {
    if (
      message.author.id !== "673362753489993749" &&
      message.author.id !== instance.client.user.id
    ) {
      return;
    }
    for (const embed of message.embeds) {
      const word = embed.title;

      if (!word || !word.includes("Tier:")) {
        continue;
      }
      const parts = word.split(" Tier: ");
      const name = parts[0];
      const tier = parts[parts.length - 1];
      if (!allowed.includes(tier)) return;
      const result = await instance.database.simpleQuery("CARD_ROLES", {
        tier: `t${tier}`,
        server_id: instance.serverIds[message.guild.id],
      });
      if (result.rows.length === 1) {
        await message.channel.send(
          `${tierInfo[`T${tier}`].emoji} <@&${
            result.rows[0].role_id
          }> | \`${name} T${tier} has spawned!\``
        );
      }
    }
  },
  eventName: "message",
};

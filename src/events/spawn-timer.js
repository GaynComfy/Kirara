const { getTimer } = require("../utils/spawnUtils");
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
      if (!word || !embed.title || !word.startsWith("To claim, ")) continue;
      const tieri = Object.values(tierInfo).find(
        t => t.color === embed.hexColor
      );
      let tier;
      if (tieri) tier = tieri.num.toString();
      const name = embed.title.split(" Tier: ")[0];

      if (
        instance.guilds[message.guild.id] &&
        instance.guilds[message.guild.id].timer
      ) {
        const timer = await getTimer(message.createdTimestamp);
        if (!timer) continue;
        let msg;
        try {
          msg = await message.channel.send(timer);
        } catch (err) {
          console.error(err);
          continue;
        }

        if (!instance.shared["timer"][message.channel.id])
          instance.shared["timer"][message.channel.id] = [];

        instance.shared["timer"][message.channel.id].push({
          name,
          tier,
          msg,
          time: message.createdTimestamp,
          message_id: message.id,
          last: Date.now(),
        });
      }
    }
  },
  eventName: "message",
};

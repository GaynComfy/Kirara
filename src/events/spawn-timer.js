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
      if (!word || !word.startsWith("To claim, ")) continue;

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

        const tieri = Object.values(tierInfo).find(
          t => t.color === embed.hexColor
        );
        let tier;
        if (tieri) tier = tieri.num.toString();

        if (!instance.shared["timer"][message.channel.id])
          instance.shared["timer"][message.channel.id] = [];

        instance.shared["timer"][message.channel.id].push({
          name: embed.title,
          tier,
          msg,
          time: message.createdTimestamp,
          last: new Date(),
        });
      }
    }
  },
  eventName: "message",
};

const { getTimer } = require("../utils/spawnUtils");

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

        if (!instance.shared["timer"][message.channel.id])
          instance.shared["timer"][message.channel.id] = [];

        instance.shared["timer"][message.channel.id].push({
          name: embed.title,
          msg,
          time: message.createdTimestamp,
          last: new Date(),
        });
      }
    }
  },
  eventName: "message",
};

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
      const word = embed.title;
      if (!word || !word.includes("Tier:")) continue;

      const parts = word.split(" Tier: ");
      const name = parts[0];
      const tier = parts[parts.length - 1];

      if (
        instance.guilds[message.guild.id] &&
        instance.guilds[message.guild.id].timer
      ) {
        const embed = await getTimer(message.createdTimestamp);
        if (!embed) continue;
        const msg = await message.channel.send(embed);

        if (!instance.shared["timer"][message.channel.id])
          instance.shared["timer"][message.channel.id] = [];

        instance.shared["timer"][message.channel.id].push({
          name,
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

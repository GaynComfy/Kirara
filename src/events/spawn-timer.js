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
        let msg;
        try {
          msg = await message.channel.send(embed);
        } catch (err) {
          console.error(err);
          if (err.code === 50013) {
            // no permissions, let's disable timer from here
            await instance.database.simpleUpdate(
              "SERVERS",
              {
                guild_id: message.guild.id,
              },
              {
                timer: false,
              }
            );
            instance.guilds[message.guild.id].timer = false;
          }
          continue;
        }

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

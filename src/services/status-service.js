let interval = null;
module.exports = {
  start: async (instance) => {
    interval = setInterval(async () => {
      const pickedActivity = Math.floor(Math.random() * 4);
      if (pickedActivity === 0) {
        await instance.client.user.setActivity(
          `Help | ${instance.config.prefix}help`,
          {
            type: "STREAMING",
            url: "https://www.twitch.tv/FinalWords79",
          }
        );
      }
      if (pickedActivity === 1) {
        await instance.client.user.setActivity(
          `Prefix | ${instance.config.prefix}`,
          {
            type: "STREAMING",
            url: "https://www.twitch.tv/FinalWords79",
          }
        );
      }
      if (pickedActivity === 2) {
        try {
          const size = await instance.client.shard.fetchClientValues(
            "guilds.cache.size"
          );
          await instance.client.user.setActivity(
            `Guilds | ${size
              .reduce((acc, guildCount) => acc + guildCount, 0)
              .toLocaleString(undefined, { style: "decimal" })}`,
            {
              type: "STREAMING",
              url: "https://www.twitch.tv/FinalWords79",
            }
          );
        } catch (ignored) {}
      }
      if (pickedActivity === 3) {
        const users = await instance.client.shard.broadcastEval(
          "this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)"
        );
        await instance.client.user.setActivity(
          `Users | ${users
            .reduce((acc, memberCount) => acc + memberCount, 0)
            .toLocaleString(undefined, { style: "decimal" })}`,
          {
            type: "STREAMING",
            url: "https://www.twitch.tv/FinalWords79",
          }
        );
      }
    }, 1000 * 60);
  },
  stop: async () => {
    if (interval !== null) clearInterval(interval);
  },
};

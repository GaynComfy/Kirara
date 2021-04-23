let interval = null;

module.exports = {
  start: async instance => {
    const status = {
      type: "STREAMING",
      url: "https://www.twitch.tv/FinalWords79",
    };
    interval = setInterval(async () => {
      const pickedActivity = Math.floor(Math.random() * 4);
      switch (pickedActivity) {
        case 0: {
          await instance.client.user.setActivity(
            `Help | ${instance.config.prefix}help`,
            status
          );
          break;
        }
        case 1: {
          await instance.client.user.setActivity(
            `Prefix | ${instance.config.prefix}`,
            status
          );
          break;
        }
        case 2: {
          try {
            const size = await instance.client.shard.fetchClientValues(
              "guilds.cache.size"
            );
            await instance.client.user.setActivity(
              `Guilds | ${size
                .reduce((acc, guildCount) => acc + guildCount, 0)
                .toLocaleString(undefined, { style: "decimal" })}`,
              status
            );
          } catch (ignored) {}
          break;
        }
        case 3: {
          const users = await instance.client.shard.broadcastEval(
            "this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)"
          );
          await instance.client.user.setActivity(
            `Users | ${users
              .reduce((acc, memberCount) => acc + memberCount, 0)
              .toLocaleString(undefined, { style: "decimal" })}`,
            status
          );
          break;
        }
      }
    }, 1000 * 60);
  },
  stop: async () => {
    if (interval !== null) clearInterval(interval);
  },
};

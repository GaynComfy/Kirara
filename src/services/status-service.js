let interval = null;

module.exports = {
  start: async instance => {
    const status = {
      type: "WATCHING",
    };
    if (interval !== null) return;

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
            const claims = await instance.client.shard.broadcastEval(
              "this.b_instance.asClaims + this.b_instance.kClaims"
            );
            await instance.client.user.setActivity(
              `Claims | ${claims
                .reduce((acc, cc) => acc + cc, 0)
                .toLocaleString(undefined, { style: "decimal" })}`,
              status
            );
          } catch {
            await instance.client.user.setActivity("trouble!", status);
          }

          break;
        }
        case 3: {
          await instance.client.user.setActivity("comfy.gay", status);
          break;
        }
      }
    }, 1000 * 60);
  },
  stop: async () => {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  },
};

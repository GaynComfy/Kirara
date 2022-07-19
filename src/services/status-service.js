let interval = null;

module.exports = {
  start: async instance => {
    if (interval !== null) return;

    const setActivity = async name =>
      await instance.client.user.setPresence({
        activities: [{ name, type: 3 }],
        status: "online",
      });

    interval = setInterval(async () => {
      const pickedActivity = Math.floor(Math.random() * 5);
      switch (pickedActivity) {
        case 0: {
          await setActivity(`Help | ${instance.config.prefix}help`);
          break;
        }
        case 1: {
          await setActivity(`Prefix | ${instance.config.prefix}`);
          break;
        }
        case 2: {
          const claims = await instance.client.shard.broadcastEval(
            client => client.b_instance.asClaims + client.b_instance.kClaims
          );
          const claimAmt = claims
            .reduce((acc, cc) => acc + cc, 0)
            .toLocaleString(undefined, { style: "decimal" });
          await setActivity(`Claims | ${claimAmt}`);
          break;
        }
        case 3: {
          await setActivity("comfy.gay");
          break;
        }
        case 4: {
          await setActivity(`Invite | ${instance.config.prefix}invite`);
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

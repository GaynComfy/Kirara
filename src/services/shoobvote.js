let interval = null;

module.exports = {
  start: async instance => {
    if (interval !== null) return;
    if (!instance.shared["shoobv"]) instance.shared["shoobv"] = [];

    interval = setInterval(async () => {
      for (const user of Object.keys(instance.shared["shoobv"])) {
        const time = instance.shared["shoobv"][user];
        if (Date.now() - time.last < 43500000) continue;
        const userH = await instance.client.users.fetch(time.user);
        if (!userH) continue;
        await userH.send("You can now vote for shoob again!");
        delete instance.shared["shoobv"][user];
      }
    }, 500000);
  },
  stop: async () => {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  },
};

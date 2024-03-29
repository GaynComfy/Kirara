let interval = null;

module.exports = {
  start: async instance => {
    if (interval !== null) return;
    if (!instance.shared["shoobv"]) instance.shared["shoobv"] = [];

    interval = setInterval(async () => {
      for (const user in instance.shared["shoobv"]) {
        const time = instance.shared["shoobv"][user];
        if (Date.now() - time.last < 43200000) continue;
        const userH = await instance.client.users.fetch(time.user);
        if (userH) {
          await userH.send(
            "You can now vote for Shoob again!\n\nhttps://top.gg/bot/673362753489993749/vote"
          );
        }
        const i = instance.shared["shoobv"].indexOf(time);
        if (i !== -1) instance.shared["shoobv"].splice(i, 1);
      }
    }, 600000);
  },
  stop: async () => {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  },
};

const { getTimer } = require("../utils/spawnUtils");

let updateInterval = null;

module.exports = {
  start: async instance => {
    if (!instance.shared["timer"]) instance.shared["timer"] = {};

    updateInterval = setInterval(async () => {
      Object.keys(instance.shared["timer"]).forEach(chan => {
        const chn = instance.shared["timer"][chan];
        chn.forEach(async timer => {
          if (new Date() - timer.last < 3500) return;
          const embed = await getTimer(timer.time);
          if (!embed) {
            timer.msg.delete().catch(() => {});
            const i = chn.indexOf(timer);
            if (i !== -1) chn.splice(i, 1);
            return;
          }

          timer.msg
            .edit(embed)
            .then(() => {
              const i = chn.indexOf(timer);
              if (i !== -1) chn[i].last = new Date();
            })
            .catch(err => console.error(err));
        });
      });
    }, 1000);
  },
  stop: async () => {
    if (updateInterval) clearInterval(updateInterval);
  },
};

const { getTimer } = require("../utils/spawnUtils");

let updateInterval = null;

module.exports = {
  start: async instance => {
    if (!instance.shared["timer"]) instance.shared["timer"] = {};

    updateInterval = setInterval(async () => {
      for (const chan of Object.keys(instance.shared["timer"])) {
        const chn = instance.shared["timer"][chan];
        for (const timer of chn) {
          if (new Date() - timer.last < 3600) continue;
          const embed = await getTimer(timer.time);
          if (!embed) {
            timer.msg.delete().catch(() => {});
            const i = chn.indexOf(timer);
            if (i !== -1) chn.splice(i, 1);
            continue;
          }

          await timer.msg
            .edit(embed)
            .then(() => {
              const i = chn.indexOf(timer);
              if (i !== -1) chn[i].last = new Date();
            })
            .catch(err => {
              console.error(err);
              // unknown message, give up
              if (err.code === 10008) {
                const i = chn.indexOf(timer);
                if (i !== -1) chn.splice(i, 1);
              }
            });
        }
      }
    }, 1000);
  },
  stop: async () => {
    if (updateInterval) clearInterval(updateInterval);
  },
};

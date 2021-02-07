const { getTimer } = require("../utils/spawnUtils");

let updateInterval = null;

module.exports = {
  start: async (instance) => {
    if (!instance.shared["timer"]) {
      instance.shared["timer"] = {};
    }

    updateInterval = setInterval(() => {
      Object.keys(instance.shared["timer"]).forEach((c) => {
        const e = instance.shared["timer"][c];
        e.forEach(async (s) => {
          if (new Date() - s.last < 4000) return;
          const e = await getTimer(s.time);
          if (!e) {
            s.msg.delete();
            const i = instance.shared["timer"][c].indexOf(s);
            if (i !== -1) instance.shared["timer"][c].splice(i, 1);
            return;
          }

          s.msg.edit(e).then(() => {
            const i = instance.shared["timer"][c].indexOf(s);
            if (i !== -1)
              instance.shared["timer"][c][i] = {
                ...instance.shared["timer"][c][i],
                last: new Date(),
              };
          });
        });
      });
    }, 1000);
  },
  stop: async (instance) => {
    if (updateInterval) clearInterval(updateInterval);
  },
};

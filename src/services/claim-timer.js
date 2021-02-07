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
        e.forEach(async (s) =>
          getTimer(s.time).then((e) => {
            if (!e) {
              s.msg.delete();
              const i = instance.shared["timer"][c].indexOf(s);
              if (i !== -1) instance.shared["timer"][c].splice(i, 1);
              return;
            }

            s.msg.edit(e);
          })
        );
      });
    }, 2000);
  },
  stop: async (instance) => {
    if (updateInterval) clearInterval(updateInterval);
  },
};

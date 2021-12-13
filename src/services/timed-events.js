let interval = null;

module.exports = {
  start(instance) {
    interval = setInterval(async() => {
    for (const key in instance.timedEvents) {
      const val = instance.timedEvents[key];
      if(Date.now() > val)  {
        delete instance.timedEvents[key];
      const update = {
        event: false,
      };
      await instance.database.simpleUpdate(
        "SERVERS",
        {
          guild_id: key,
        },
        update
      );
      instance.guilds[key] = {
        ...instance.guilds[key],
        ...update,
      };
      }
    }
    }, 1000);
  },
  stop() {
    if(interval) {
      clearInterval(interval);
      interval = null;
    }
  }
};
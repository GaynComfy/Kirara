const dayjs = require("dayjs");

let interval = null;
let lastMonth = null;
module.exports = {
  disabled: process.env.NODE_ENV !== "development",
  async start(instance) {
    const k = `misc:kdr_month`;
    lastMonth = (await instance.cache.exists(k))
      ? await instance.cache.get(k)
      : dayjs().month();

    interval = setInterval(async () => {
      const monthNow = dayjs().month();
      if (monthNow !== lastMonth) {
        const keys = await instance.cache.keys("kdrop:*:*");
        for (const entry of keys) instance.cache.delete(entry);
        instance.cache.set(k, monthNow);
      }
      lastMonth = monthNow;
    }, 60000);
  },
  stop() {
    if (interval) clearInterval(interval);
  },
};

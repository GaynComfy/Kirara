const dayjs = require("dayjs");

const ROLE_ID = "902758184794595380";
const sleep = time => new Promise(resolve => setTimeout(resolve, time));

let interval = null;
let lastDay = dayjs().day();
module.exports = {
  disabled: process.env.NODE_ENV !== "development",
  start(instance) {
    interval = setInterval(async () => {
      if (!instance.client.guilds.cache.has("378599231583289346")) return;

      const dayNow = dayjs().day();
      if (dayNow < lastDay) {
        // set this here to not trigger twice
        lastDay = dayNow;
        const guild = instance.client.guilds.cache.get("378599231583289346");
        const roles = await instance.cache.keys("xpcount_role:*");
        const keys = await instance.cache.keys("xpcount:*");
        // TIME COMPLEXITY GOD HAVE MERCY FOR MY SINS
        for (const entry of keys) instance.cache.delete(entry);

        for (const entry of roles) {
          await instance.cache.delete(entry);
          try {
            const member = await guild.members.fetch(entry.split(":")[1]);
            await member.roles.remove(ROLE_ID);
            await sleep(500);
          } catch (err) {
            console.log(
              "cant reset member because they arent fetchable",
              entry
            );
          }
        }
      }
      lastDay = dayNow;
    }, 5000);
  },
  stop() {
    if (interval) clearInterval(interval);
  },
};

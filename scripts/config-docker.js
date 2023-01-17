const dayjs = require("dayjs");
dayjs.extend(require("dayjs/plugin/utc"));
dayjs.extend(require("dayjs/plugin/timezone"));

const tz = "America/New_York";
const birth = dayjs.tz("2020-11-08 00:00:00", tz);

module.exports = {
  prefix: "k!",
  database: {
    host: "database",
    user: "kirara",
    database: "kirara",
    port: 5432,
  },
  cache: {
    host: "redis",
    port: 6379,
    db: 0,
  },
  structure: {
    commands: "commands",
    events: "events",
    restEvents: "restEvents",
    services: "services",
  },
  owner: [
    "554476322303246388", // Nota#8888
    "304357538101723137", // ⋆˚🌺⃤ Jorgy₊ ˚#5611
    "77256980288253952", // Alycans#1693
    "195906408561115137", // Liz3#0001
    "175408504427905025", // JeDaYoshi#7942
    "758539113229451266", // Nay#9424
    "97707213690249216", // offbeatwitch#8860
    "445192864654295050", // RaiYito#3718
    "933549055538249728", // bappy#3311
    "189978735816998913", // cass#9999
  ],
  shardCount: 1,
  devServerId: "1064798672182853653",
  clientId: "1064770831911223397",
  get season() {
    return dayjs.tz(Date.now(), tz).diff(birth, "month");
  },
};

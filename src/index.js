//basic meta information
const isDev = process.env.NODE_ENV === "development";
const config = isDev ? require("./config-dev") : require("./config-prod");

//db stuff
const postgresConnect = require("./storage/database/");
const redisConnect = require("./storage/redis/");

// Setup Databases
const { registerFont } = require("canvas");
registerFont("./assets/fonts/CenturyGothic.ttf", { family: "Century Gothic" });
registerFont("./assets/fonts/Porter.ttf", { family: "Porter" });

//discord
const discordConnect = require("./discord/");

const Instance = require("./Instance");

const start = async () => {
  const pgApi = await postgresConnect(
    {
      host: process.env.PG_HOST,
      port: process.env.PG_PORT,
      user: process.env.PG_USER,
      password: process.env.PG_PASWORD,
      db: process.env.PG_DATABASE,
    },
    !isDev
  );

  const redisApi = await redisConnect(
    {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DATABASE,
    },
    !isDev,
    true
  );
  const { client: discordClient, login: onReady } = await discordConnect();
  const instance = new Instance(
    config,
    pgApi,
    redisApi,
    discordClient,
    onReady
  );
  await instance.bootrap(false, false);
};
start().catch(err => {
  console.error(err);
  process.exit(1);
});

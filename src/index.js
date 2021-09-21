// Program Metadata
const config =
  process.env.NODE_ENV === "development"
    ? require("./config-dev")
    : require("./config-prod");

// Database Connection
const postgresConnect = require("./storage/database/");
const { RedisAPI, RedisEvents } = require("./storage/redis/");

// Register Canvas
const { registerFont } = require("canvas");
registerFont("./assets/fonts/CenturyGothic.ttf", { family: "Century Gothic" });
registerFont("./assets/fonts/Porter.ttf", { family: "Porter" });

// Discord Client
const discordConnect = require("./discord/");

const Instance = require("./Instance");
const start = async () => {
  const pgAPI = await postgresConnect({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  });

  const redisAPI = await RedisAPI({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    database: process.env.REDIS_DATABASE,
  });

  const redisEvents = await RedisEvents({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  });

  const { client: discordClient, login: onReady } = await discordConnect();
  const instance = new Instance(
    config,
    pgAPI,
    redisAPI,
    redisEvents,
    discordClient,
    onReady
  );
  await instance.bootrap(false, false);
};
start().catch(err => {
  console.error(err);
  process.exit(1);
});

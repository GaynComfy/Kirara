//basic meta information
const isDev = process.env.NODE_ENV === "development";
const config = isDev ? require("./config-dev") : require("./config-prod");

//db stuff
const postgresConnect = require("./storage/database/");
const redisConnect = require("./storage/redis/");

//discord
const discordConnect = require("./discord/");

const Instance = require("./Instance");

config.isDev = isDev;
const start = async () => {
  const pgApi = await postgresConnect(config, !isDev);

  const redisApi = await redisConnect(config, !isDev, true);
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

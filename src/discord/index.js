const Discord = require("discord.js");

module.exports = (token = process.env.TOKEN) => {
  const client = new Discord.Client({
    messageCacheMaxSize: 100,
    messageCacheLifetime: 900,
    messageSweepInterval: 900,
    messageEditHistoryMaxSize: 3,
    presence: {
      status: "idle",
      activity: {
        name: "starting up...",
        type: 3,
      },
    },
  });
  return {
    client,
    login: () => {
      client.login(token);
    },
  };
};

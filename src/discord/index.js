const Discord = require("discord.js");

module.exports = (token = process.env.TOKEN) => {
  const client = new Discord.Client({
    disableMentions: "everyone",
    messageCacheMaxSize: 200,
    messageCacheLifetime: 1800,
    messageSweepInterval: 1800,
    messageEditHistoryMaxSize: 5,
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
    login: () => client.login(token),
  };
};

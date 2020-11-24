const Discord = require("discord.js");

module.exports = (token = process.env.TOKEN) => {
  const client = new Discord.Client();
  return {
    client,
    login: () => {
      client.login(token);
    },
  };
};

const Discord = require("discord.js");

module.exports = (token = process.env.TOKEN) => {
  const client = new Discord.Client({
    allowedMentions: {
      parse: ["users"],
      repliedUser: true,
    },
    presence: {
      status: "idle",
      activities: [{ name: "starting up...", type: 3 }],
    },
  });
  return {
    client,
    login: () => client.login(token),
  };
};

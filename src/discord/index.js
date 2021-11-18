const { Client, Intents } = require("discord.js");

module.exports = (token = process.env.TOKEN) => {
  const client = new Client({
    allowedMentions: {
      parse: ["users"],
      repliedUser: true,
    },
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_TYPING,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
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

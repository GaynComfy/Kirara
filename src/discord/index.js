const { Client, Intents } = require("discord.js");

module.exports = (token = process.env.TOKEN) => {
  const intents = [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_WEBHOOKS,
  ];
  if (process.env.NODE_ENV === "development") {
    intents.push(Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_INTEGRATIONS);
  }

  const client = new Client({
    allowedMentions: {
      parse: ["users"],
      repliedUser: true,
    },
    intents,
    presence: {
      status: "idle",
      activities: [{ name: "starting up...", type: 3 }],
    },
    failIfNotExists: false,
  });
  return {
    client,
    login: () => client.login(token),
  };
};

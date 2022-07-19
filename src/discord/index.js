const { Client, GatewayIntentBits } = require("discord.js");

module.exports = (token = process.env.TOKEN) => {
  const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    // ToDo: Readd this once we migrate spammy events
    // (auctions, minigames, etc.) to webhooks
    // GatewayIntentBits.GuildWebhooks,
    // GatewayIntentBits.GuildIntegrations,
  ];

  const client = new Client({
    allowedMentions: {
      parse: ["users"],
      repliedUser: false,
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

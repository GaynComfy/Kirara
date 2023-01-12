const { Client, GatewayIntentBits, Options } = require("discord.js");

const emoteGuilds = ["689738297890701338", "378599231583289346"];

module.exports = (token = process.env.TOKEN) => {
  const client = new Client({
    allowedMentions: {
      parse: ["users"],
      repliedUser: false,
    },
    failIfNotExists: false,
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      // GatewayIntentBits.DirectMessages,
      // GatewayIntentBits.DirectMessageReactions,
      // ToDo: Readd this once we migrate spammy events
      // (auctions, minigames, etc.) to webhooks
      // GatewayIntentBits.GuildWebhooks,
      // GatewayIntentBits.GuildIntegrations,
    ],
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      ApplicationCommandManager: 0,
      AutoModerationRuleManager: 0,
      GuildApplicationCommandManager: 0,
      GuildBanManager: 0,
      GuildInviteManager: 0,
      GuildScheduledEventManager: 0,
      StageInstanceManager: 0,
      VoiceStateManager: 0,
      GuildMemberManager: {
        maxSize: 500000,
        keepOverLimit: u => u.id === client.user.id,
      },
      ReactionManager: {
        maxSize: 4000000,
        keepOverLimit: r => r.message.author.id === client.user.id,
      },
      BaseGuildEmojiManager: {
        maxSize: 0,
        keepOverLimit: e => emoteGuilds.includes(e.guild.id),
      },
    }),
    presence: {
      status: "idle",
      activities: [{ name: "starting up...", type: 3 }],
    },
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: {
        interval: 600, // every 10 minutes
        lifetime: 3600, // 1 hr or older
      },
    },
  });
  return {
    client,
    login: () => client.login(token),
  };
};

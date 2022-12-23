const { Client, GatewayIntentBits, Options } = require("discord.js");
const { DefaultRestOptions } = require("@discordjs/rest");

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
      BaseGuildEmojiManager: {
        maxSize: 0,
        keepOverLimit: e => emoteGuilds.includes(e.guild.id),
      },
      GuildApplicationCommandManager: 0,
      GuildBanManager: 0,
      GuildEmojiManager: {
        maxSize: 0,
        keepOverLimit: e => emoteGuilds.includes(e.guild.id),
      },
      GuildInviteManager: 0,
      GuildMemberManager: {
        maxSize: 100,
        keepOverLimit: u => u.id === client.user.id,
      },
      GuildScheduledEventManager: 0,
      GuildStickerManager: 0,
      MessageManager: {
        maxSize: 100,
        keepOverLimit: m => m.author.id === client.user.id,
      },
      PresenceManager: 0,
      ReactionManager: {
        maxSize: 0,
        keepOverLimit: r => r.message.author.id === client.user.id,
      },
      StageInstanceManager: 0,
      VoiceStateManager: 0,
    }),
    presence: {
      status: "idle",
      activities: [{ name: "starting up...", type: 3 }],
    },
    rest: {
      ...DefaultRestOptions,

      api: process.env.DISCORD_API_URL || DefaultRestOptions.api,
    },
    sweepers: {
      ...Options.DefaultSweeperSettings,

      guildMembers: {
        interval: 600,

        filter: () => m =>
          m.id !== client.user.id && !m.permissions.has("Administrator"),
      },
      messages: {
        interval: 120,
        lifetime: 600,
      },
    },
  });
  return {
    client,
    login: () => client.login(token),
  };
};

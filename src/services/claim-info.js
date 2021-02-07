const redis = require("redis");
const Discord = require("discord.js");
const GuildDelete = require("../events/GuildDelete");
const tierSettings = {
  1: { emoji: "<:NewT1:781684991372689458>", num: 1, color: "#e8e8e8" },
  2: { emoji: "<:NewT2:781684993071251476>", num: 2, color: "#2ed60d" },
  3: { emoji: "<:NewT3:781684993331953684>", num: 3, color: "#1a87ed" },
  4: { emoji: "<:NewT4:781684993449001011>", num: 4, color: "#a623a6" },
  5: { emoji: "<:NewT5:781684993834352680>", num: 5, color: "#ffe814" },
  6: { emoji: "<:NewT6:781684992937558047>", num: 6, color: "#ff170f" },
};

let client = null;
let deleteInterval = null;
const deleteMap = {};

module.exports = {
  start: async (instance) => {
    deleteInterval = setInterval(async () => {
      const now = Date.now();
      Object.keys(deleteMap).forEach((k) => {
        const e = deleteMap[k];
        if (e.time > now) return;
        e.msg.delete();
        delete deleteMap[k];
      });
    }, 1000);

    const { config } = instance;
    client = redis.createClient(
      `redis://${config.cache.host}:${config.cache.port}`
    );
    client.subscribe("claims");
    client.on("message", async (channel, message) => {
      if (channel === "claims") {
        const data = JSON.parse(message);

        if (instance.client.guilds.cache.has(data.server_id)) {
          const guild = instance.client.guilds.cache.get(data.server_id);
          const settings = tierSettings[data.tier];

          const timers = instance.shared["timer"][data.channel_id];
          if (timers) {
            const s = timers.find(
              (p) => p.tier === data.tier && p.name === data.card_name
            );
            if (s) {
              s.msg.delete().catch((err) => console.error(err));
              const i = instance.shared["timer"][data.channel_id].indexOf(s);
              if (i !== -1)
                instance.shared["timer"][data.channel_id].splice(i, 1);
            }
          }

          if (instance.guilds[guild.id].log_channel) {
            const logChannel = guild.channels.cache.get(
              instance.guilds[guild.id].log_channel
            );
            if (logChannel) {
              const log = new Discord.MessageEmbed()
                .setAuthor(
                  "Shoob",
                  "https://cdn.animesoul.com/images/content/shoob/shoob-no-empty-space.png"
                )
                .setColor(settings.color)
                .setThumbnail(
                  encodeURI(data.image_url).replace(".webp", ".gif")
                )
                .setFooter(data.server_name)
                .setTimestamp();
              if (data.claimed) {
                log.setDescription(
                  `${settings.emoji} <@${data.discord_id}> has claimed [${data.card_name} Tier: ${data.tier}](https://animesoul.com/cards/info/${data.card_id}) Issue: \`${data.issue}\``
                );
              } else {
                log.setDescription(
                  `${settings.emoji} [${data.card_name} Tier: ${data.tier}](https://animesoul.com/cards/info/${data.card_id}) Despawned`
                );
              }
              try {
                await logChannel.send(log);
              } catch (err) {
                console.error(err);
              }
            }
          }

          if (
            !data.claimed ||
            instance.settings[data.server_id]["claim:disabled"]
          )
            return;

          const messageChannel = guild.channels.cache.get(data.channel_id);
          if (messageChannel) {
            const oweeet = new Discord.MessageEmbed()
              .setDescription(
                `<a:Sirona_loading:748854549703426118> [\`${data.card_name}\`](https://animesoul.com/cards/info/${data.card_id}) ` +
                  `Issue #: \`${data.issue}\` has been claimed!\n${settings.emoji} Added to <@${data.discord_id}>'s database.\n\u200b`
              )
              .setFooter(
                "Got a problem? Use s!support\nWant to invite the bot? Use s!invite"
              )
              .setColor(settings.color)
              .setThumbnail(encodeURI(data.image_url).replace(".webp", ".gif"));

            try {
              const msg = await messageChannel.send(oweeet);
              // With T6 spawns being corrupted, I believe it'd be better to do this.
              if (data.tier !== "6")
                deleteMap[msg.id] = { msg, time: Date.now() + 15 * 1000 };
            } catch (err) {
              console.error(err);
            }
          }
        }
      }
    });
  },
  stop: async (instance) => {
    if (deleteInterval) clearInterval(deleteInterval);
    if (client !== null) {
      client.removeAllListeners("message");
      client.end(true);
      client = null;
    }
  },
};

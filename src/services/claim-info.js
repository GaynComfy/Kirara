const Redis = require("ioredis");
const { MessageEmbed } = require("discord.js");
const { tierInfo } = require("../utils/cardUtils");

let client = null;
let deleteInterval = null;
const deleteMap = {};

module.exports = {
  start: async instance => {
    deleteInterval = setInterval(async () => {
      const now = Date.now();
      Object.keys(deleteMap).forEach(k => {
        const e = deleteMap[k];
        if (e.time > now) return;
        e.msg.delete().catch(() => {});
        delete deleteMap[k];
      });
    }, 1000);

    const { config } = instance;
    client = new Redis(`redis://${config.cache.host}:${config.cache.port}`);
    client.subscribe("claims");
    client.on("message", async (channel, message) => {
      if (channel === "claims") {
        const data = JSON.parse(message);

        if (instance.client.guilds.cache.has(data.server_id)) {
          const guild = instance.client.guilds.cache.get(data.server_id);
          const messageChannel = guild.channels.cache.get(data.channel_id);
          const settings = tierInfo[`T${data.tier.toUpperCase()}`];

          const timers = instance.shared["timer"][data.channel_id];
          if (timers) {
            const s = timers.find(
              p => p.tier === data.tier && p.name === data.card_name
            );
            if (s) {
              s.msg.delete().catch(() => {});
              const i = timers.indexOf(s);
              if (i !== -1) timers.splice(i, 1);
            }
          }

          if (instance.guilds[data.server_id].log_channel) {
            const logChannel = guild.channels.cache.get(
              instance.guilds[data.server_id].log_channel
            );
            if (logChannel) {
              const log = new MessageEmbed()
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
                  `${settings.emoji} <@${data.discord_id}> has claimed [${data.card_name} Tier: ${data.tier}]` +
                    `(https://animesoul.com/cards/info/${data.card_id})\n` +
                    `<a:Sirona_loading2:748849251597025311> Issue: \`${data.issue}\`\n` +
                    (data.from_clyde
                      ? `<a:Sirona_loading:748854549703426118> Sent from Clyde!`
                      : `<a:Sirona_star:748985391360507924> **New issue!**`)
                );
              } else {
                log.setDescription(
                  `${settings.emoji} [${data.card_name} Tier: ${data.tier}](https://animesoul.com/cards/info/${data.card_id}) despawned`
                );
              }
              try {
                await logChannel.send(log);
              } catch (err) {
                console.error(err);
                if (err.code === 50001 || err.code === 50013) {
                  // missing permissions, removing the logchan
                  await instance.database.simpleUpdate(
                    "SERVERS",
                    {
                      guild_id: guild.id,
                    },
                    {
                      log_channel: null,
                    }
                  );
                  instance.guilds[guild.id].log_channel = null;
                }
              }
            } else {
              // channel doesn't exists, remove it
              await instance.database.simpleUpdate(
                "SERVERS",
                {
                  guild_id: guild.id,
                },
                {
                  log_channel: null,
                }
              );
              instance.guilds[guild.id].log_channel = null;
            }
          }

          if (
            !data.claimed ||
            !instance.settings[data.server_id]["claim:enabled"]
          )
            return;

          const prefix =
            instance.guilds[guild.id].prefix || instance.config.prefix;
          if (messageChannel) {
            const oweeet = new MessageEmbed()
              .setDescription(
                `<a:Sirona_loading:748854549703426118> [\`${data.card_name}\`](https://animesoul.com/cards/info/${data.card_id}) ` +
                  `Issue #: \`${data.issue}\` has been claimed!\n${settings.emoji} Added to <@${data.discord_id}>'s database.\n\u200b`
              )
              .setFooter(
                `Got a problem? Use ${prefix}support\nWant to invite the bot? Use ${prefix}invite`
              )
              .setColor(settings.color)
              .setThumbnail(encodeURI(data.image_url).replace(".webp", ".gif"));

            try {
              const msg = await messageChannel.send(oweeet);
              // With T6 spawns being corrupted, I believe it'd be better to do this.
              if (data.tier !== "6")
                deleteMap[msg.id] = { msg, time: Date.now() + 15 * 1000 };
            } catch (err) {
              if (err.code === 50013) return;
              console.error(err);
            }
          }
        }
      }
    });
  },
  stop: async () => {
    if (deleteInterval) clearInterval(deleteInterval);
    if (client !== null) {
      client.removeAllListeners("message");
      client.end(true);
      client = null;
    }
  },
};

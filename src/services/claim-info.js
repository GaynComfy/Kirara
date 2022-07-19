const Redis = require("ioredis");
const { EmbedBuilder } = require("discord.js");
const { tierInfo } = require("../utils/cardUtils");

let client = null;
let deleteInterval = null;
const deleteMap = {};

module.exports = {
  start: async instance => {
    if (deleteInterval !== null || client !== null) return;
    if (!instance.shared["recent"]) instance.shared["recent"] = {};

    // temp workaround, todo pls remove later
    instance.shared["deleteMap"] = deleteMap;

    deleteInterval = setInterval(async () => {
      const now = Date.now();
      Object.keys(deleteMap).forEach(k => {
        const e = deleteMap[k];
        if (e.time > now) return;
        e.msg.delete().catch(() => null);
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

          if (!data.kirara) {
            const shardId = instance.client.shard.ids[0];
            if (process.env.NODE_ENV !== "production") {
              if (data.claimed) {
                console.debug(
                  `[${shardId}] [API] <@!${data.discord_id}> claimed T${data.tier} ${data.card_name} V${data.issue} on <#${data.channel_id}>`
                );
              } else {
                console.debug(
                  `[${shardId}] [API] T${data.tier} ${data.card_name} despawned on <#${data.channel_id}>`
                );
              }
            }
            instance.asClaims++;
          }

          const timers = instance.shared["timer"][data.channel_id];
          if (timers) {
            const s = timers.find(
              p =>
                p.message_id === data.message_id ||
                ((p.tier ? p.tier === data.tier : true) &&
                  p.name === data.card_name)
            );
            if (s) {
              s.msg.delete().catch(() => null);
              const i = timers.indexOf(s);
              if (i !== -1) timers.splice(i, 1);
            }
          }

          const spawns = instance.shared["spawn"][data.channel_id];
          if (spawns) {
            const s = spawns.find(p => p.message_id === data.message_id);
            if (s) {
              const i = spawns.indexOf(s);
              if (i !== -1) spawns.splice(i, 1);
            }
          }

          instance.temp.delete(`recent:${data.server_id}:all`);
          instance.temp.delete(`recent:${data.server_id}:${data.tier}`);
          instance.temp.delete(`season:${data.server_id}`);

          if (data.claimed) {
            const member = await guild.members.fetch(data.discord_id);

            const { rows: roles } = await instance.database.simpleQuery(
              "CLAIM_ROLES",
              {
                server_id: instance.serverIds[guild.id],
              }
            );

            if (roles.length) {
              const { rows: claims } = await instance.database.simpleQuery(
                "CARD_CLAIMS",
                {
                  server_id: instance.serverIds[guild.id],
                  discord_id: member.id,
                }
              );

              roles.forEach(r => {
                if (
                  claims.length >= r.claims &&
                  !member.roles.cache.has(r.role_id)
                ) {
                  member.roles
                    .add(r.role_id, "Shoob claim count")
                    .catch(console.error);
                }
              });
            }
          }

          if (instance.guilds[data.server_id].log_channel) {
            const logChannel = guild.channels.cache.get(
              instance.guilds[data.server_id].log_channel
            );
            if (logChannel) {
              const log = new EmbedBuilder()
                .setAuthor({
                  name: "Shoob",
                  iconURL:
                    "https://cdn.animesoul.com/images/content/shoob/shoob-no-empty-space.png",
                })
                .setColor(settings.color)
                .setFooter({ text: data.server_name })
                .setTimestamp();
              if (data.image_url) {
                log.setThumbnail(
                  encodeURI(data.image_url).replace(".webp", ".gif")
                );
              }
              if (data.claimed) {
                log.setDescription(
                  `${settings.emoji} <@${data.discord_id}> has claimed [${data.card_name} Tier: ${data.tier}]` +
                    `(https://shoob.gg/cards/info/${data.card_id})\n` +
                    `<a:Sirona_loading2:748849251597025311> Issue: \`${data.issue}\`\n` +
                    (data.from_clyde
                      ? `<a:Sirona_loading:748854549703426118> Sent from Clyde!`
                      : `<a:Sirona_star:748985391360507924> **New issue!**`)
                );
              } else {
                log.setDescription(
                  `${settings.emoji} [${data.card_name} Tier: ${data.tier}](https://shoob.gg/cards/info/${data.card_id}) despawned`
                );
              }
              try {
                await logChannel.send({ embeds: [log] });
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

          if (messageChannel) {
            const oweeet = new EmbedBuilder()
              .setDescription(
                `<a:Sirona_loading:748854549703426118> [\`${data.card_name}\`](https://shoob.gg/cards/info/${data.card_id}) ` +
                  `Issue #: \`${data.issue}\` has been claimed!\n\n${settings.emoji} Added to <@${data.discord_id}>'s database.`
              )
              .setColor(settings.color);
            if (data.image_url) {
              oweeet.setThumbnail(
                encodeURI(data.image_url).replace(".webp", ".gif")
              );
            }

            try {
              const msg = await messageChannel.send({ embeds: [oweeet] });
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
    if (deleteInterval) {
      clearInterval(deleteInterval);
      deleteInterval = null;
    }
    if (client !== null) {
      client.removeAllListeners("message");
      client.end(true);
      client = null;
    }
  },
};

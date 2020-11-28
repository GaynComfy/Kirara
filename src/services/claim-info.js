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
module.exports = {
  start: async (instance) => {
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
          const member = data.claimed
            ? guild.members.cache.get(data.discord_id)
            : null;
          if (!member && data.claimed) {
            console.error("claim user not found");
            return;
          }
          if (instance.logChannels[guild.id]) {
            const logChannel = guild.channels.cache.get(
              instance.logChannels[guild.id]
            );
            if (logChannel) {
              const log = new Discord.MessageEmbed();
              if (data.claimed) {
                log
                  .setAuthor(
                    "Shoob",
                    "https://cdn.animesoul.com/images/content/shoob/shoob-no-empty-space.png"
                  )
                  .setDescription(
                    `${tierSettings[data.tier].emoji} <@${
                      member.user.id
                    }> has claimed [${data.card_name} Tier: ${
                      data.tier
                    }](https://animesoul.com/cards/info/${
                      data.card_id
                    }) Issue: \`${data.issue}\``
                  )
                  .setColor(tierSettings[data.tier].color)
                  .setThumbnail(data.image_url)
                  .setFooter(data.server_name)
                  .setTimestamp();
              } else {
                const settings = tierSettings[data.tier];

                log
                  .setAuthor(
                    "Shoob",
                    "https://cdn.animesoul.com/images/content/shoob/shoob-no-empty-space.png"
                  )
                  .setDescription(
                    `${settings.emoji} [${data.card_name} Tier: ${data.tier}](https://animesoul.com/cards/info/${data.card_id}) Despawned`
                  )
                  .setColor(settings.color)
                  .setThumbnail(data.image_url)
                  .setFooter(data.server_name)
                  .setTimestamp();
              }
              try {
                await logChannel.send(log);
              } catch (err) {
                console.error(err);
              }
            }
          }
          if (!data.claimed) return;
          const messageChannel = guild.channels.cache.get(data.channel_id);
          if (messageChannel) {
            const oweeet = new Discord.MessageEmbed()
              .setDescription(
                `<a:Sirona_loading:748854549703426118> [\`${data.card_name}\`](https://animesoul.com/cards/info/${data.card_id}) ` +
                `Issue #: \`${data.issue}\` has been claimed!\n<a:Sirona_Tick:749202570341384202> Added to <@${data.discord_id}>'s database.\n\u200b`
              )
              .setFooter(
                "Got a problem? Use s!support\nWant to invite the bot? Use s!invite"
              )
              .setColor("RANDOM")
              .setThumbnail(data.image_url);

            try {
              const msg = await messageChannel.send(oweeet);
              setTimeout(() => msg.delete(), 15000);
            } catch (err) {
              console.error(err);
            }
          }
        }
      }
    });
  },
  stop: async (instance) => {
    if (client !== null) {
      client.removeAllListeners("message");
      client.end(true);
      client = null;
    }
  },
};

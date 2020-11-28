const redis = require("redis");
const Discord = require("discord.js");
const GuildDelete = require("../events/GuildDelete");
const tierSettings = {
  1: { emoji: "<:T1:754538833386668075>", num: 1, color: "#e8e8e8" },
  2: { emoji: "<:T2:754538833504370779>", num: 2, color: "#2ed60d" },
  3: { emoji: "<:T3:754540393797910562>", num: 3, color: "#1a87ed" },
  4: { emoji: "<:T4:754540393760161905>", num: 4, color: "#a623a6" },
  5: { emoji: "<:T5:754540394137518092>", num: 5, color: "#ffe814" },
  6: { emoji: "<:T6:754541597479403612>", num: 6, color: "#ff170f" },
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
                      member.user.username
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
                `<a:Sirona_loading:748854549703426118> Adding [\`${data.card_name}\`](https://animesoul.com/cards/info/${data.card_id}) Issue #:\`${data.issue}\` to **<@${data.discord_id}>'s** Database!\n<:Sirona_ArrowPink:748852891481014324> Total claims: **${data.total}**\n\u200b`
              )
              .setFooter(
                "Got a problem? use s!support\n Want to invite the bot? Use s!invite"
              )
              .setColor("RANDOM");

            try {
              messageChannel.send(oweeet);
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

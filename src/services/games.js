const redis = require("redis");
const { MessageEmbed } = require("discord.js");
const { tierInfo } = require("../utils/cardUtils");
const tierSettings = {
  1: { emoji: "<:NewT1:781684991372689458>", num: 1, color: "#e8e8e8" },
  2: { emoji: "<:NewT2:781684993071251476>", num: 2, color: "#2ed60d" },
  3: { emoji: "<:NewT3:781684993331953684>", num: 3, color: "#1a87ed" },
  4: { emoji: "<:NewT4:781684993449001011>", num: 4, color: "#a623a6" },
  5: { emoji: "<:NewT5:781684993834352680>", num: 5, color: "#ffe814" },
  6: { emoji: "<:NewT6:781684992937558047>", num: 6, color: "#ff170f" },
};
const allowed = ["3", "4", "5", "6", "S"];
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
    const { config, settings } = instance;
    client = redis.createClient(
      `redis://${config.cache.host}:${config.cache.port}`
    );
    client.subscribe("games");
    client.on("message", async (channel, message) => {
      if (channel === "games") {
        const data = JSON.parse(message);
        if (!allowed.includes(data.tier)) return;
        const tier = tierSettings[data.tier];
        const embed = new MessageEmbed()
          .setTitle(`> <:SShoob:783636544720207903> Enter the Minigame`)
          .setURL(`https://animesoul.com/mini-game/${data.id}`)
          .setColor(tier.color)
          .setThumbnail(`https://animesoul.com/api/cardr/${data.card_id}`)
          .setDescription(
            `${tier.emoji} [\`${data.card_name}\` • \`T${data.tier}\`]` +
              `(https://animesoul.com/cards/info/${data.card_id}) • \`V${data.version}\` is on a minigame!`
          );

        instance.client.guilds.cache
          .array()
          .filter((g) => instance.settings[g.id]["games_channel"])
          .forEach(async (guild) => {
            const logChannel = guild.channels.cache.get(
              instance.settings[guild.id]["games_channel"]
            );
            if (logChannel) {
              const autodel = instance.settings[guild.id]["games_autodelete"];
              try {
                const msg = await logChannel.send(embed);
                if (autodel) {
                  deleteMap[msg.id] = {
                    msg,
                    time: Date.now() + parseInt(autodel) * 60 * 1000,
                  };
                }
              } catch (err) {
                console.error(err);
              }
            } else {
              // channel doesn't exists, delete from notifications
              const {
                rows: [result],
              } = await instance.database.simpleQuery("SETTINGS", {
                key: `games_channel`,
                guild_id: guild.id,
              });
              if (!result) return;
              const {
                rows: [autodel],
              } = await instance.database.simpleQuery("SETTINGS", {
                key: `games_autodelete`,
                guild_id: guild.id,
              });

              await instance.database.simpleDelete("SETTINGS", {
                id: result.id,
              });
              delete instance.settings[guild.id][`games_channel`];
              if (autodel) {
                await instance.database.simpleDelete("SETTINGS", {
                  id: autodel.id,
                });
                delete instance.settings[guild.id][`games_autodelete`];
              }
            }
          });
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

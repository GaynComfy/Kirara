const { MessageEmbed } = require("discord.js");
const Constants = require("../utils/Constants.json");
const { tierInfo } = require("../utils/cardUtils");

const allAllowed = ["T2", "T3"].concat(Constants.allowedAucTiers);

let client = null;
let deleteInterval = null;
const deleteMap = {};

module.exports = {
  start: async instance => {
    if (deleteInterval !== null || client !== null) return;

    deleteInterval = setInterval(async () => {
      const now = Date.now();
      Object.keys(deleteMap).forEach(k => {
        const e = deleteMap[k];
        if (e.time > now) return;
        e.msg.delete().catch(() => {});
        delete deleteMap[k];
      });
    }, 1000);

    const onMessage = async (channel, message) => {
      if (channel !== "games") return;

      const data = JSON.parse(message);
      const tier = `T${data.tier.toUpperCase()}`;
      if (
        // normal cases
        (process.env.NODE_ENV !== "development" &&
          !Constants.allowedAucTiers.includes(tier)) ||
        // ToDo: change this to checker if the user/server has voted in top.gg
        (process.env.NODE_ENV === "development" && !allAllowed.includes(tier))
      )
        return;

      const tierSettings = tierInfo[tier];
      const embed = new MessageEmbed()
        .setTitle(`> <:Shoob:910973650042236938> Enter the Minigame`)
        .setURL(`https://animesoul.com/mini-game/${data.id}`)
        .setColor(tierSettings.color)
        .setThumbnail(`https://animesoul.com/api/cardr/${data.card_id}`)
        .setDescription(
          `${tierSettings.emoji} [\`${data.card_name}\` • \`T${data.tier}\`]` +
            `(https://animesoul.com/cards/info/${data.card_id}) • \`V${data.version}\` is on a minigame!`
        );

      const guilds = instance.client.guilds.cache
        .filter(g => instance.settings[g.id]["games_channel"])
        .sort((a, b) => {
          // give priority to network servers
          // maybe use this in the future for top.gg votes rewards too?
          // also maybe priorise those servers with most claims first too. but that needs more changes
          if (Constants.network.includes(b.id)) return 1;
          if (Constants.network.includes(a.id)) return -1;
          return 0;
        });

      console.debug(
        `[${instance.client.shard.ids[0]}] Broadcasting minigame ${data.id} to ${guilds.size} guilds`
      );

      for (const guild of guilds.values()) {
        const logChannel = guild.channels.cache.get(
          instance.settings[guild.id]["games_channel"]
        );
        if (logChannel) {
          const autodel = instance.settings[guild.id]["games_autodelete"];
          try {
            const msg = await logChannel.send({ embeds: [embed] });
            if (autodel) {
              deleteMap[msg.id] = {
                msg,
                time: Date.now() + parseInt(autodel) * 60 * 1000,
              };
            }
          } catch (err) {
            console.error(err);
            if (err.code === 50001 || err.code === 50013) {
              // missing permisions, delete from notifications
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
          }
        }
      }
    };

    client = instance.redisEvents;
    client.subscribe("games");
    client.on("message", onMessage);
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

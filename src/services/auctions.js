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
      if (channel !== "auctions") return;

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
        .setTitle(`> <:SShoob:783636544720207903> Enter the Auction`)
        .setURL(`https://animesoul.com/auction/${data.id}`)
        .setColor(tierSettings.color)
        .setThumbnail(`https://animesoul.com/api/cardr/${data.card_id}`)
        .setDescription(
          `${tierSettings.emoji} [\`${data.card_name}\` • \`T${data.tier}\`]` +
            `(https://animesoul.com/cards/info/${data.card_id}) • \`V${data.version}\` is being auctioned!`
        )
        .addField("Starting Bid", `\`富 ${Math.round(data.bn / 5)}\``, true)
        .addField("Buy Now", `\`富 ${data.bn}\``, true)
        .addField(
          "Owner",
          `[${data.username}](https://animesoul.com/user/${data.discord_id})`,
          true
        );

      const guilds = instance.client.guilds.cache
        .array()
        .filter(g => instance.settings[g.id]["notif_channel"])
        .sort((a, b) => {
          // give priority to network servers
          // maybe use this in the future for top.gg votes rewards too?
          // also maybe prioritise those servers with most claims first too. but that needs more changes
          if (Constants.network.includes(b.id)) return 1;
          if (Constants.network.includes(a.id)) return -1;
          return 0;
        });

      console.debug(
        `[${instance.client.shard.ids[0]}] Broadcasting auction ${data.id} to ${guilds.length} guilds`
      );
      //      let ranSleep = false;
      for (const guild of guilds) {
        // if(!Constants.network.includes(guild.id) && !ranSleep) {
        //   const len = guilds.filter(g => !Constants.network.includes(g.id)).length;
        //   const shard_id = instance.client.shard.ids[0];
        //   let guildCount ;

        //   const delay = instance.client.shard.ids[0] * (len * 1.3) * 500;
        //   await new Promise(resolve => setTimeout(resolve, delay));
        //   ranSleep = true;
        // }
        const logChannel = guild.channels.cache.get(
          instance.settings[guild.id]["notif_channel"]
        );
        if (logChannel) {
          const autodel = instance.settings[guild.id]["notif_autodelete"];
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
            if (err.code === 50001 || err.code === 50013) {
              // missing permissions, delete from notifications
              const {
                rows: [result],
              } = await instance.database.simpleQuery("SETTINGS", {
                key: `notif_channel`,
                guild_id: guild.id,
              });
              if (!result) return;
              const {
                rows: [autodel],
              } = await instance.database.simpleQuery("SETTINGS", {
                key: `notif_autodelete`,
                guild_id: guild.id,
              });

              await instance.database.simpleDelete("SETTINGS", {
                id: result.id,
              });
              delete instance.settings[guild.id][`notif_channel`];
              if (autodel) {
                await instance.database.simpleDelete("SETTINGS", {
                  id: autodel.id,
                });
                delete instance.settings[guild.id][`notif_autodelete`];
              }
            }
          }
        }
      }
    };
    const shard_id = instance.client.shard.ids[0];
    if (shard_id === 0) {
      client = instance.redisEvents;
      client.subscribe("auctions");
      client.on("message", async (channel, msg) => {
        await onMessage(channel, msg).catch(err => console.error(err));
        for (let i = 1; i < instance.client.shard.count; i++) {
          await instance.client.shard
            .broadcastEval(
              `this.b_handle_auction(${JSON.stringify(
                channel
              )}, ${JSON.stringify(msg)})`,
              i
            )
            .catch(err => console.log(err));
        }
      });
    } else {
      instance.client.b_handle_auction = async (channel, data) =>
        await onMessage(channel, data).catch(err => console.error(err));
    }
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

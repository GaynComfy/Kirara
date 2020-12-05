const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const auc = ["auctions", "auc"];
const games = ["games", "minigames", "mg"];

const info = {
  name: "notifs",
  aliases: ["notifications"],
  matchCase: false,
  category: "Administration",
};

const execute = async (instance, message, args, send = true) => {
  return withRights(message.member, async () => {
    if (args.length <= 1) return false;
    const embed = new MessageEmbed().setColor("RANDOM");
    let type = args[0].toLowerCase();
    args.splice(0, 1);

    if (auc.includes(type)) {
      type = "notif";
    } else if (games.includes(type)) {
      type = "games";
    } else if (type === "all") {
      // horrible hack. i don't feel proud about this. todo change later
      await execute(instance, message, ["auc", ...args], true);
      return await execute(instance, message, ["mg", ...args], false);
    } else return false;

    const {
      rows: [result],
    } = await instance.database.simpleQuery("SETTINGS", {
      key: `${type}_channel`,
      guild_id: message.guild.id,
    });
    const {
      rows: [autodel],
    } = await instance.database.simpleQuery("SETTINGS", {
      key: `${type}_autodelete`,
      guild_id: message.guild.id,
    });

    if (args.length >= 1 && args[0] === "off") {
      if (!result) {
        embed.setDescription("No notification channel set anyway!");
        if (send) message.channel.send(embed);
        return;
      }
      await instance.database.simpleDelete("SETTINGS", {
        id: result.id,
      });
      delete instance.settings[message.guild.id][`${type}_channel`];
      if (autodel) {
        await instance.database.simpleDelete("SETTINGS", {
          id: autodel.id,
        });
        delete instance.settings[message.guild.id][`${type}_autodelete`];
      }
      embed.setDescription(
        `<a:Sirona_Tick:749202570341384202> Notification channel removed!`
      );
    }
    if (args.length >= 2 && args[1] === "off") {
      if (!autodel) {
        embed.setDescription("No notification auto-delete timer set anyway!");
        if (send) message.channel.send(embed);
        return true;
      }
      await instance.database.simpleDelete("SETTINGS", {
        id: autodel.id,
      });
      delete instance.settings[message.guild.id][`${type}_autodelete`];
      embed.setDescription(
        `<a:Sirona_Tick:749202570341384202> Notification auto-delete timer removed!`
      );
      if (send) message.channel.send(embed);
      return true;
    }
    if (args.length >= 2 && isNaN(args[1])) return false;
    if (message.mentions.channels.size === 1) {
      const { id } = message.mentions.channels.first();
      if (result) {
        await instance.database.simpleUpdate(
          "SETTINGS",
          {
            id: result.id,
          },
          {
            value: id,
          }
        );
        instance.settings[message.guild.id][`${type}_channel`] = id;
        if (
          autodel &&
          args.length >= 2 &&
          args[1] !== "off" &&
          args[1] !== "0"
        ) {
          await instance.database.simpleUpdate(
            "SETTINGS",
            {
              id: autodel.id,
            },
            {
              value: args[1],
            }
          );
          instance.settings[message.guild.id][`${type}_autodelete`] = args[1];
        }
      } else {
        await instance.database.simpleInsert("SETTINGS", {
          key: `${type}_channel`,
          guild_id: message.guild.id,
          server_id: instance.serverIds[message.guild.id],
          value: id,
        });
        instance.settings[message.guild.id][`${type}_channel`] = id;
        if (args.length >= 2 && args[1] !== "off" && args[1] !== "0") {
          await instance.database.simpleInsert("SETTINGS", {
            key: `${type}_autodelete`,
            guild_id: message.guild.id,
            server_id: instance.serverIds[message.guild.id],
            value: args[1],
          });
          instance.settings[message.guild.id][`${type}_autodelete`] = args[1];
        }
      }
      embed.setDescription(
        `<a:Sirona_Tick:749202570341384202> Notifications channel set to <#${id}>!` +
          (args.length >= 2 && args[1] !== "off" && args[1] !== "0"
            ? `\n⏲️ Messages will be auto-deleted after ${args[1]} minutes.`
            : "")
      );
    }
    if (send) message.channel.send(embed);
    return true;
  });
};

module.exports = {
  execute,
  info,
  help: {
    usage: "notifs <auctions/minigames> <#channel/off> [autodelete in mins]",
    examples: [
      "notifs auc #asn-auctions",
      "notifs games #asn-network-chet 5",
      "notifs auctions off",
    ],
    description: "Set up notifications for Auctions, Minigames and the likes!",
  },
};

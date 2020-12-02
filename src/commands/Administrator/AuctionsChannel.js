const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "aucnotifs",
  aliases: ["auctionsnotifications"],
  matchCase: false,
  category: "Administration",
};
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length === 0 && message.mentions.channels.size === 0) {
        return false;
      }
      const embed = new MessageEmbed().setColor("RANDOM");
      const {
        rows: [result],
      } = await instance.database.simpleQuery("SETTINGS", {
        key: "notif_channel",
        guild_id: message.guild.id,
      });
      const {
        rows: [autodel],
      } = await instance.database.simpleQuery("SETTINGS", {
        key: "notif_autodelete",
        guild_id: message.guild.id,
      });

      if (args.length >= 1 && args[0] === "off") {
        if (!result) {
          embed.setDescription("No Auction Notification Channel set anyway!");
          message.channel.send(embed);
          return;
        }
        await instance.database.simpleDelete("SETTINGS", {
          id: result.id,
        });
        delete instance.settings[message.guild.id]["notif_channel"];
        if (autodel) {
          await instance.database.simpleDelete("SETTINGS", {
            id: autodel.id,
          });
          delete instance.settings[message.guild.id]["notif_autodelete"];
        }
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Auction Notification Channel removed!`
        );
      }
      if (args.length >= 2 && args[1] === "off") {
        if (!autodel) {
          embed.setDescription(
            "No Auction Notification auto-delete set anyway!"
          );
          message.channel.send(embed);
          return true;
        }
        await instance.database.simpleDelete("SETTINGS", {
          id: autodel.id,
        });
        delete instance.settings[message.guild.id]["notif_autodelete"];
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Auction notification auto-delete removed!`
        );
        message.channel.send(embed);
        return true;
      }
      if (args.length >= 2 && isNaN(args[1])) return false;
      if (message.mentions.channels.size === 1) {
        const { id, name } = message.mentions.channels.first();
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
          instance.settings[message.guild.id]["notif_channel"] = id;
          if (autodel && args.length >= 2 && args[1] !== "off") {
            await instance.database.simpleUpdate(
              "SETTINGS",
              {
                id: autodel.id,
              },
              {
                value: args[1],
              }
            );
            instance.settings[message.guild.id]["notif_autodelete"] = args[1];
          }
        } else {
          await instance.database.simpleInsert("SETTINGS", {
            key: "notif_channel",
            guild_id: message.guild.id,
            server_id: instance.serverIds[message.guild.id],
            value: id,
          });
          instance.settings[message.guild.id]["notif_channel"] = id;
          if (args.length === 2 && args[1] !== "off") {
            await instance.database.simpleInsert("SETTINGS", {
              key: "notif_autodelete",
              guild_id: message.guild.id,
              server_id: instance.serverIds[message.guild.id],
              value: args[1],
            });
            instance.settings[message.guild.id]["notif_autodelete"] = args[1];
          }
        }
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Auction Notifications Channel Set to <#${id}>!` +
            (args.length >= 2 && args[1] !== "off"
              ? `\n⏲️ Messages will be auto-deleted in ${args[1]} minutes.`
              : "")
        );
      }
      message.channel.send(embed);
      return true;
    });
  },
  info,
  help: {
    usage: "aucnotifs <#channel> [autodelete in mins]",
    examples: [
      "aucnotifs #asn-shoob-logs",
      "aucnotifs #asn-network-chet 5",
      "aucnotifs off",
    ],
    description: "Set Notification Channel for Auctions and the likes!",
  },
};

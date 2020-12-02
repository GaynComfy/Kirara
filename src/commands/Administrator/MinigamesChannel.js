const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "gamenotifs",
  aliases: ["gamesnotifications"],
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
        key: "games_channel",
        guild_id: message.guild.id,
      });
      const {
        rows: [autodel],
      } = await instance.database.simpleQuery("SETTINGS", {
        key: "games_autodelete",
        guild_id: message.guild.id,
      });

      if (args.length >= 1 && args[0] === "off") {
        if (!result) {
          embed.setDescription("No Minigames Notification Channel set anyway!");
          message.channel.send(embed);
          return;
        }
        await instance.database.simpleDelete("SETTINGS", {
          id: result.id,
        });
        delete instance.settings[message.guild.id]["games_channel"];
        if (autodel) {
          await instance.database.simpleDelete("SETTINGS", {
            id: autodel.id,
          });
          delete instance.settings[message.guild.id]["games_autodelete"];
        }
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Minigames Notification Channel removed!`
        );
      }
      if (args.length >= 2 && args[1] === "off") {
        if (!autodel) {
          embed.setDescription(
            "No Minigames Notification auto-delete set anyway!"
          );
          message.channel.send(embed);
          return true;
        }
        await instance.database.simpleDelete("SETTINGS", {
          id: autodel.id,
        });
        delete instance.settings[message.guild.id]["games_autodelete"];
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Minigames notification auto-delete removed!`
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
          instance.settings[message.guild.id]["games_channel"] = id;
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
            instance.settings[message.guild.id]["games_autodelete"] = args[1];
          }
        } else {
          await instance.database.simpleInsert("SETTINGS", {
            key: "games_channel",
            guild_id: message.guild.id,
            server_id: instance.serverIds[message.guild.id],
            value: id,
          });
          instance.settings[message.guild.id]["games_channel"] = id;
          if (args.length === 2 && args[1] !== "off") {
            await instance.database.simpleInsert("SETTINGS", {
              key: "games_autodelete",
              guild_id: message.guild.id,
              server_id: instance.serverIds[message.guild.id],
              value: args[1],
            });
            instance.settings[message.guild.id]["games_autodelete"] = args[1];
          }
        }
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Minigames Notifications Channel Set to <#${id}>!` +
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
    usage: "gamenotifs <#channel> [autodelete in mins]",
    examples: [
      "gamenotifs #asn-shoob-logs",
      "gamenotifs #asn-network-chet 5",
      "gamenotifs off",
    ],
    description: "Set Notification Channel for Minigames and the likes!",
  },
};

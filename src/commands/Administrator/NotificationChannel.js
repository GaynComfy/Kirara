const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "notifs",
  aliases: ["notifications"],
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

      if (args.length === 1 && args[0] === "off") {
        if (!result) {
          embed.setDescription("No Notification Channel set anyway!");
          message.channel.send(embed);
          return;
        }
        await instance.database.simpleDelete("SETTINGS", {
          id: result.id,
        });
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Notification Channel removed!`
        );
      }
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
        } else {
          await instance.database.simpleInsert("SETTINGS", {
            key: "notif_channel",
            guild_id: message.guild.id,
            server_id: instance.serverIds[message.guild.id],
            value: id,
          });
        }
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Notifications Channel Set to ${name}!`
        );
      }
      message.channel.send(embed);
      return true;
    });
  },
  info,
  help: {
    usage: "notifs [#channel]",
    examples: ["notifs #asn-shoob-logs", "notifs off"],
    description:
      "Set Notification Channel for Auctions/Minigames and the likes!",
  },
};

const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "cdnotify",
  aliases: ["cooldownnotify"],
  matchCase: false,
  category: "Administration",
  disabled: true,
};
const allowed = ["on", "off"];
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (
        (args.length > 0 && !allowed.includes(args[0].toLowerCase())) ||
        args.length > 1
      )
        return false;
      const embed = new MessageEmbed().setColor("RANDOM");
      const { rows } = await instance.database.simpleQuery("SETTINGS", {
        key: "cooldown:notify",
        guild_id: message.guild.id,
        value: "true",
      });

      if (args.length === 0) {
        const toggle = rows.length >= 1 ? "on" : "off";
        embed.setDescription(
          `<a:Sirona_loading:748854549703426118> Cooldown notify is ${toggle}.`
        );
      } else {
        const newState = args[0].toLowerCase() === "on";
        if (newState && rows.length === 0) {
          await instance.database.simpleInsert("SETTINGS", {
            key: "cooldown:notify",
            value: "true",
            server_id: instance.serverIds[message.guild.id],
            guild_id: message.guild.id,
          });
          instance.settings[message.guild.id]["cooldown:notify"] = true;
        } else if (!newState && rows.length >= 1) {
          await instance.database.simpleDelete("SETTINGS", {
            id: rows[0].id,
          });
          instance.settings[message.guild.id]["cooldown:notify"] = false;
        }

        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Cooldown notify is now ${args[0].toLowerCase()}!`
        );
      }
      return message.channel.send(embed);
    });
  },
  info,
  help: {
    usage: "cdnotify [on/off]",
    examples: ["cdnotify on", "cdnotify"],
    description: "Toggle the cooldown notify for Shoob card spawns!",
  },
};

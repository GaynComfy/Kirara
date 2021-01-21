const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "cmdtoggle",
  aliases: ["toggle"],
  matchCase: false,
  category: "Administration",
};
const allowed = ["on", "off"];
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length === 0) return false;

      let cmd;
      if (!instance.eventManager.commands[args[0]]) {
        for (const commandKey of Object.keys(instance.eventManager.commands)) {
          const currentEntry = instance.eventManager.commands[commandKey];
          if (!currentEntry.info.matchCase) {
            if (
              currentEntry.info.name.toLowerCase() === args[0].toLowerCase() ||
              (Array.isArray(currentEntry.info.aliases) &&
                currentEntry.info.aliases.find(
                  (e) => e.toLowerCase() === args[0].toLowerCase()
                ))
            ) {
              cmd = currentEntry.info.name;
            }
          } else {
            if (
              Array.isArray(currentEntry.info.aliases) &&
              currentEntry.info.aliases.find((e) => e === args[0])
            ) {
              cmd = currentEntry.info.name;
            }
          }
        }
      } else {
        cmd = args[0];
      }

      if (!cmd) return false;

      const query = {
        key: `cmd:${cmd}:disabled`,
        value: "true",
        server_id: instance.serverIds[message.guild.id],
        guild_id: message.guild.id,
      };
      const result = await instance.database.simpleQuery("SETTINGS", query);

      if (args.length === 0) {
        const toggle = result.rows.length === 0 ? "enabled" : "disabled";
        const embed = new MessageEmbed()
          .setDescription(
            `<a:Sirona_Tick:749202570341384202> \`${cmd}\` is ${toggle}.`
          )
          .setColor("RANDOM");
        message.channel.send({ embed });
        return true;
      }

      const toggle = args[1].toLowerCase() === "on";

      if (toggle && result.rows.length >= 1) {
        // no settings when it should be on - default behaviour
        await instance.database.simpleDelete("SETTINGS", {
          id: result.rows[0].id,
        });
        delete instance.settings[message.guild.id][`cmd:${cmd}:disabled`];
      } else if (!toggle && result.rows.length === 0) {
        await instance.database.simpleInsert("SETTINGS", query);
        instance.settings[message.guild.id][`cmd:${cmd}:disabled`] = true;
      }

      const embed = new MessageEmbed()
        .setDescription(
          `<a:Sirona_Tick:749202570341384202> \`${cmd}\` has been turned ${args[1].toLowerCase()}.`
        )
        .setColor("RANDOM");
      message.channel.send({ embed });
      return true;
    });
  },
  info,
  help: {
    usage: "toggle [command] [on/off]",
    examples: ["toggle neko", "toggle uwu off"],
    description: "Enable or disable commands for usage by server members.",
  },
};

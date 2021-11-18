const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "claim",
  matchCase: false,
  category: "Administration",
};
const allowed = ["on", "off"];
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length !== 0 && !allowed.includes(args[0].toLowerCase()))
        return false;

      const query = {
        key: "claim:enabled",
        value: "true",
        server_id: instance.serverIds[message.guild.id],
        guild_id: message.guild.id,
      };
      const result = await instance.database.simpleQuery("SETTINGS", query);

      if (args.length === 0) {
        const toggle = result.rows.length === 0 ? "off" : "on";
        const embed = new MessageEmbed()
          .setDescription(
            `<a:Sirona_Tick:749202570341384202> Claim messages are turned ${toggle}.`
          )
          .setColor("RANDOM");
        message.channel.send({ embeds: [embed] });
        return true;
      }

      const toggle = args[0].toLowerCase() === "on";

      if (toggle && result.rows.length === 0) {
        // why is this true i don't know but deal with it
        await instance.database.simpleInsert("SETTINGS", query);
        instance.settings[message.guild.id]["claim:enabled"] = true;
      } else if (!toggle && result.rows.length >= 1) {
        await instance.database.simpleDelete("SETTINGS", {
          id: result.rows[0].id,
        });
        delete instance.settings[message.guild.id]["claim:enabled"];
      }

      const embed = new MessageEmbed()
        .setDescription(
          `<a:Sirona_Tick:749202570341384202> Claim messages have been turned ${args[0].toLowerCase()}.`
        )
        .setColor("RANDOM");
      message.channel.send({ embeds: [embed] });
      return true;
    });
  },
  info,
  help: {
    usage: "claim [on/off]",
    examples: ["claim", "claim off"],
    description: "Toggle the Shoob card claim message!",
  },
};

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
      if (args.length === 0 || !allowed.includes(args[0].toLowerCase()))
        return false;
      const toggle = args[0].toLowerCase() === "on";
      const query = {
        key: "claim:disabled",
        value: "true",
        server_id: instance.serverIds[message.guild.id],
        guild_id: message.guild.id
      };
      const result = await instance.database.simpleQuery("SETTINGS", query);

      if (toggle && result.rows.length >= 1) {
        // no settings when it should be on - default behaviour
        await instance.database.simpleDelete("SETTINGS", {
          id: result.rows[0].id
        });
        delete instance.settings[message.guild.id]["claim:disabled"];
      } else if (!toggle && result.rows.length === 0) {
        // why is this true i don't know but deal with it
        await instance.database.simpleInsert("SETTINGS", query);
        instance.settings[message.guild.id]["claim:disabled"] = true;
      }

      const embed = new MessageEmbed()
        .setDescription(
          `<a:Sirona_Tick:749202570341384202> Claim messages have been turned ${args[0].toLowerCase()}.`
        )
        .setColor("RANDOM");
      message.channel.send({ embed });
      return true;
    };
  },
  info,
  help: {
    usage: "claim <on/off>",
    examples: ["claim off"],
    description: "Toggle the Shoob card claim message!",
  },
};

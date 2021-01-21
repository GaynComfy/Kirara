const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "categorytoggle",
  aliases: ["ctoggle"],
  matchCase: false,
  category: "Administration",
};
const allowed = ["on", "off"];
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length === 0) return false;

      const all = Object.values(instance.eventManager.commands);
      const categories = {};
      all.forEach((elem) => {
        c = Object.keys(categories);
        if (!c.includes(elem.info.category.toLowerCase()))
          categories[elem.info.category.toLowerCase()] = elem.info.category;
      });

      const category = args[0].toLowerCase();
      if (!categories[category]) return false;

      const query = {
        key: `category:${category}:disabled`,
        value: "true",
        server_id: instance.serverIds[message.guild.id],
        guild_id: message.guild.id,
      };
      const result = await instance.database.simpleQuery("SETTINGS", query);

      if (args.length === 0) {
        const toggle = result.rows.length === 0 ? "enabled" : "disabled";
        const embed = new MessageEmbed()
          .setDescription(
            `<a:Sirona_Tick:749202570341384202> \`${categories[category]}\` is ${toggle}.`
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
        delete instance.settings[message.guild.id][
          `category:${category}:disabled`
        ];
      } else if (!toggle && result.rows.length === 0) {
        await instance.database.simpleInsert("SETTINGS", query);
        instance.settings[message.guild.id][
          `category:${category}:disabled`
        ] = true;
      }

      const embed = new MessageEmbed()
        .setDescription(
          `<a:Sirona_Tick:749202570341384202> \`${
            categories[category]
          }\` has been turned ${args[1].toLowerCase()}.`
        )
        .setColor("RANDOM");
      message.channel.send({ embed });
      return true;
    });
  },
  info,
  help: {
    usage: "ctoggle [category] [on/off]",
    examples: ["toggle Shoob", "toggle Roleplay on"],
    description:
      "Enable or disable whole command categories for usage by server members.",
  },
};

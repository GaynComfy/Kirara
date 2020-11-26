const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "rpsize",
  matchCase: false,
  category: "Administration",
};
const allowed = ["small", "big"];
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length === 0) return false;
      if (!allowed.includes(args[0].toLowerCase())) return false;
      const result = await instance.database.simpleQuery("SETTINGS", {
        key: "roleplay_size:" + message.channel.id,
        value: "true",
      });
      if (args[0] === "small") {
        if (result.rows.length === 1) {
          const embed = new MessageEmbed()
            .setDescription(
              "<:NoCross:732292174254833725> Already set to small."
            )
            .setColor("RANDOM");
          return message.channel.send(embed);
        }
        await instance.database.simpleInsert("SETTINGS", {
          key: "roleplay_size:" + message.channel.id,
          value: "true",
          server_id: instance.serverIds[message.guild.id],
          guild_id: message.guild.id,
        });
        instance.settings[message.guild.id][
          "roleplay_size:" + message.channel.id
        ] = true;
        const embed = new MessageEmbed()
          .setDescription("<:NoCross:732292174254833725> set to small embeds.")
          .setColor("RANDOM");
        return message.channel.send(embed);
      } else {
        if (result.rows.length !== 1) {
          const embed = new MessageEmbed()
            .setDescription("<:NoCross:732292174254833725> Already set to big.")
            .setColor("RANDOM");
          return message.channel.send(embed);
        }
        await instance.database.simpleDelete("SETTINGS", {
          id: result.rows[0].id,
        });
        delete instance.settings[message.guild.id][
          "roleplay_size:" + message.channel.id
        ];
        const embed = new MessageEmbed()
          .setDescription("<:NoCross:732292174254833725> set to big embeds.")
          .setColor("RANDOM");
        return message.channel.send(embed);
      }
    });
  },
  info,
  help: {
    usage: "Set Roleplay embed size",
    examples: ["rpsize small/big"],
    description: "Set the embed size for RolePlay Commands",
  },
};

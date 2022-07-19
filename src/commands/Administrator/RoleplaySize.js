const { withRights } = require("../../utils/hooks");
const { EmbedBuilder } = require("discord.js");

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
      const embed = new EmbedBuilder().setColor("Random");

      const { rows: result } = await instance.database.simpleQuery("SETTINGS", {
        key: `roleplay_size:${message.channel.id}`,
        value: "true",
      });
      if (args[0] === "small") {
        if (result.length === 1) {
          embed.setDescription(
            "<:Sirona_NoCross:762606114444935168> Already set to small."
          );
          return message.channel.send({ embeds: [embed] });
        }
        await instance.database.simpleInsert("SETTINGS", {
          key: `roleplay_size:${message.channel.id}`,
          value: "true",
          server_id: instance.serverIds[message.guild.id],
          guild_id: message.guild.id,
        });
        instance.settings[message.guild.id][
          `roleplay_size:${message.channel.id}`
        ] = true;
        embed.setDescription(
          "<a:Sirona_Tick:749202570341384202> Set to small embeds!"
        );
      } else {
        if (result.length !== 1) {
          embed.setDescription(
            "<:Sirona_NoCross:762606114444935168> Already set to big."
          );
          return message.channel.send({ embeds: [embed] });
        }
        await instance.database.simpleDelete("SETTINGS", {
          id: result[0].id,
        });
        delete instance.settings[message.guild.id][
          `roleplay_size:${message.channel.id}`
        ];
        embed.setDescription(
          "<a:Sirona_Tick:749202570341384202> Set to big embeds!"
        );
      }

      return message.channel.send({ embeds: [embed] });
    });
  },
  info,
  help: {
    usage: "rpsize <small/big>",
    examples: ["rpsize big"],
    description: "Set the embed size for Roleplay commands",
  },
};

const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "roleset",
  aliases: ["tierping", "set"],
  matchCase: false,
  category: "Administration",
};
const emotes = {
  t1: "<:NewT1:781684991372689458>",
  t2: "<:NewT2:781684993071251476>",
  t3: "<:NewT3:781684993331953684>",
  t4: "<:NewT4:781684993449001011>",
  t5: "<:NewT5:781684993834352680>",
  t6: "<:NewT6:781684992937558047>",
};
const allowed = ["t3", "t4", "t5", "t6"];
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length !== 2) {
        return false;
      }
      if (!allowed.includes(args[0].toLowerCase())) return false;
      const {
        rows: [server],
      } = await instance.database.simpleQuery("SERVERS", {
        guild_id: message.guild.id,
      });
      if (server) {
        const serverId = Number.parseInt(server.id);
        const roleQuery = await instance.database.simpleQuery("CARD_ROLES", {
          tier: args[0].toLowerCase(),
          server_id: serverId,
        });
        if (args[1] === "off") {
          if (roleQuery.rows.length === 0) {
            const embedz = new MessageEmbed()
              .setDescription(
                `<a:Sirona_Tick:749202570341384202> No role set for ${args[0].toUpperCase()} pings! ${
                  emotes[args[0].toLowerCase()]
                }`
              )
              .setColor("RANDOM");
            message.channel.send({ embed: embedz });
          } else {
            await instance.database.simpleDelete("CARD_ROLES", {
              tier: args[0].toLowerCase(),
              server_id: serverId,
            });
            const embedz = new MessageEmbed()
              .setDescription(
                `<a:Sirona_Tick:749202570341384202> Removed ${args[0].toUpperCase()} pings! ${
                  emotes[args[0].toLowerCase()]
                }`
              )
              .setColor("RANDOM");
            message.channel.send({ embed: embedz });
          }
        } else {
          if (message.mentions.roles.size === 0) return false;
          const role = message.mentions.roles.first();
          if (roleQuery.rows.length === 0) {
            await instance.database.simpleInsert("CARD_ROLES", {
              server_id: serverId,
              tier: args[0].toLowerCase(),
              role_id: role.id,
            });
          } else {
            await instance.database.simpleUpdate(
              "CARD_ROLES",
              {
                server_id: serverId,
                tier: args[0].toLowerCase(),
              },
              {
                role_id: role.id,
              }
            );
          }

          const embed = new MessageEmbed()
            .setDescription(
              `<a:Sirona_Tick:749202570341384202> <@&${
                role.id
              }> has been set for ${args[0].toUpperCase()} pings! ${
                emotes[args[0].toLowerCase()]
              }`
            )
            .setColor("RANDOM");

          message.channel.send({ embed: embed });
        }
      }

      return true;
    });
  },
  info,
  help: {
    usage: "roleset <T3/T4/T5/T6> <@role/off>",
    examples: ["roleset t6 @T6", "roleset t4 off"],
    description: "Set Shoob card tiers role mentions for your server!",
  },
};

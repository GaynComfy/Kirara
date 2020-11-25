const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "set",
  matchCase: false,
  category: "Administration",
  cooldown: 5,
};
const emotes = {
  t1: "",
  t2: "<:T2:754538833504370779>",
  t3: "<:T3:754540393797910562>",
  t4: "<:T4:754540393760161905>",
  t5: "<:T5:754540394137518092>",
  t6: "<:T6:754541597479403612>",
};
const allowed = ["t1", "t2", "t3", "t4", "t5", "t6"];
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length !== 2) {
        return false;
      }
      if (!allowed.includes(args[0])) return false;
      const {
        rows: [server],
      } = await instance.database.simpleQuery("SERVERS", {
        guild_id: message.guild.id,
      });
      if (server) {
        const serverId = Number.parseInt(server.id);
        const roleQuery = await instance.database.simpleQuery("CARD_ROLES", {
          tier: args[0],
          server_id: serverId,
        });
        if (args[1] === "off") {
          if (roleQuery.rows.length === 0) {
            const embedz = new MessageEmbed()
              .setDescription(
                `<a:Sirona_Tick:749202570341384202> No role set for ${args[0].toUpperCase()} pings! ${
                  emotes[args[0]]
                }`
              )
              .setColor("RANDOM");
            message.channel.send({ embed: embedz });
          } else {
            await instance.database.simpleDelete("CARD_ROLES", {
              tier: args[0],
              server_id: serverId,
            });
            const embedz = new MessageEmbed()
              .setDescription(
                `<a:Sirona_Tick:749202570341384202> removed ${args[0].toUpperCase()} pings! ${
                  emotes[args[0]]
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
              tier: args[0],
              role_id: role.id,
            });
          } else {
            await instance.database.simpleUpdate(
              "CARD_ROLES",
              {
                server_id: serverId,
                tier: args[0],
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
                emotes[args[0]]
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
    usage: "set [T1|T2|T3|T4|T5|T6] @role",
    examples: ["set"],
    description: "Set pinging card tiers for your server.",
  },
};

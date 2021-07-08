const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");
const Constants = require("../../utils/Constants.json");

const info = {
  name: "roleset",
  aliases: ["tierping", "set"],
  matchCase: false,
  category: "Administration",
  perms: ["MENTION_EVERYONE"],
  disabled: true, // now against Anime Soul rules
};
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length !== 2) return false;
      const tier = args[0].toLowerCase();
      if (!Constants.tiers.includes(tier)) return false;
      const tierUpper = args[0].toUpperCase();

      const embed = new MessageEmbed().setColor("RANDOM");

      const { rows: roleQuery } = await instance.database.simpleQuery(
        "CARD_ROLES",
        {
          tier: tier,
          server_id: instance.serverIds[message.guild.id],
        }
      );
      if (args[1].toLowerCase() === "off") {
        if (roleQuery.length === 0) {
          embed.setDescription(
            `<a:Sirona_Tick:749202570341384202> No role set for ${tierUpper} pings! ${Constants.emotes[tier]}`
          );
        } else {
          await instance.database.simpleDelete("CARD_ROLES", {
            tier: tier,
            server_id: instance.serverIds[message.guild.id],
          });
          embed.setDescription(
            `<a:Sirona_Tick:749202570341384202> Removed ${tierUpper} pings! ${Constants.emotes[tier]}`
          );
        }
      } else {
        if (message.mentions.roles.size === 0) return false;

        const role = message.mentions.roles.first();
        if (roleQuery.length === 0) {
          await instance.database.simpleInsert("CARD_ROLES", {
            server_id: instance.serverIds[message.guild.id],
            tier: tier,
            role_id: role.id,
          });
        } else {
          await instance.database.simpleUpdate(
            "CARD_ROLES",
            {
              server_id: instance.serverIds[message.guild.id],
              tier: tier,
            },
            {
              role_id: role.id,
            }
          );
        }

        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> <@&${role.id}> has been set for ${tierUpper} pings! ${Constants.emotes[tier]}`
        );
      }

      return message.channel.send(embed);
    });
  },
  info,
  help: {
    usage: "roleset <T3/T4/T5/T6> <@role/off>",
    examples: ["roleset t6 @T6", "roleset t4 off"],
    description: "Set Shoob card tiers role mentions for your server!",
  },
};

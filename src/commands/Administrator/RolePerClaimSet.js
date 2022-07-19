const { withRights } = require("../../utils/hooks");
const { EmbedBuilder } = require("discord.js");

const info = {
  name: "roleperclaimset",
  aliases: ["rpcs"],
  matchCase: false,
  category: "Administration",
};

module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length !== 2) return false;
      const claimCount = parseInt(args[0].toLowerCase());
      if (isNaN(claimCount)) return false;

      const embed = new EmbedBuilder().setColor("RANDOM");

      const { rows: roleQuery } = await instance.database.pool.query(
        "SELECT * FROM claim_roles WHERE server_id = $1 AND claims = $2",
        [instance.serverIds[message.guild.id], claimCount]
      );

      if (args[1].toLowerCase() === "off") {
        if (roleQuery.length === 0) {
          embed.setDescription(
            `<a:Sirona_Tick:749202570341384202> No role set for ${claimCount} claim${
              claimCount !== 1 ? "s" : ""
            }!`
          );
        } else {
          await instance.database.simpleDelete("CLAIM_ROLES", {
            claims: claimCount,
            server_id: instance.serverIds[message.guild.id],
          });
          embed.setDescription(
            `<a:Sirona_Tick:749202570341384202> Removed the ${claimCount} claim role${
              claimCount !== 1 ? "s" : ""
            }!`
          );
        }
      } else {
        if (message.mentions.roles.size === 0) return false;

        const role = message.mentions.roles.first();
        if (roleQuery.length === 0) {
          await instance.database.simpleInsert("CLAIM_ROLES", {
            server_id: instance.serverIds[message.guild.id],
            claims: claimCount,
            role_id: role.id,
          });
        } else {
          await instance.database.simpleUpdate(
            "CLAIM_ROLES",
            {
              server_id: instance.serverIds[message.guild.id],
              claims: claimCount,
            },
            {
              role_id: role.id,
            }
          );
        }

        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> <@&${
            role.id
          }> has been set for ${claimCount} claim${
            claimCount !== 1 ? "s" : ""
          }!`
        );
      }

      return message.channel.send({ embeds: [embed] });
    });
  },
  info,
  help: {
    usage: "roleperclaimset <number> <@role/off>",
    examples: ["roleperclaimset 5000 @egg", "roleperclaimset 50 @nog"],
    description: "Set the role for claiming a certain amount of cards",
  },
};

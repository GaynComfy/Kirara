const { withRights } = require("../../utils/hooks");
const { EmbedBuilder } = require("discord.js");
const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");

const info = {
  name: "settings",
  matchCase: false,
  category: "Administration",
};
module.exports = {
  execute: async (instance, message /*args*/) => {
    return withRights(message.member, async () => {
      /*const { rows: roleQuery } = await instance.database.simpleQuery(
        "CARD_ROLES",
        {
          server_id: instance.serverIds[message.guild.id],
        }
      );
      const roleArray = Constants.tiers.map(tier => {
        const r = roleQuery.find(ro => ro.tier === tier);
        let role = `${Constants.emotes[tier]} ${tier.toUpperCase()}`;

        if (r) role = `${role}: <@&${r.role_id}>`;
        else role = `${role}: Not set`;

        return role;
      });*/

      const claimQuery = {
        key: "claim:enabled",
        value: "true",
        server_id: instance.serverIds[message.guild.id],
        guild_id: message.guild.id,
      };
      const { rows: claim } = await instance.database.simpleQuery(
        "SETTINGS",
        claimQuery
      );
      const toggle = claim.length === 0 ? "off" : "on";
      const event = instance.guilds[message.guild.id].event ? "on" : "off";

      const logChn = instance.guilds[message.guild.id].log_channel;
      let logs = "off";
      if (logChn) logs = `<#${logChn}>`;

      const embed = new EmbedBuilder()
        .setAuthor({
          name: Constants.name,
          iconURL: Constants.avatar,
        })
        .setColor(Color.white)
        .setDescription(
          `These are the current settings for \`${message.guild.name}\``
        )
        .addFields([
          { name: "Event", value: event, inline: true },
          { name: "Claim message", value: toggle, inline: true },
          { name: "Spawn logs", value: logs, inline: true },
        ]);
      /*.addField(
          "Spawn roles",
          roleQuery.length === 0 ? "No roles set" : roleArray,
          true
        )*/

      await message.channel.send({ embeds: [embed] });
      return true;
    });
  },
  info,
  help: {
    usage: "settings",
    examples: ["settings"],
    description: "View the server settings!",
  },
};

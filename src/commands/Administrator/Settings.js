const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");

const info = {
  name: "settings",
  matchCase: false,
  category: "Administration",
  usage: "settings",
  examples: ["settings"],
  description: "View the server settings!",
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

      const embed = new MessageEmbed()
        .setAuthor(Constants.name, Constants.avatar)
        .setColor(Color.white)
        .setDescription(
          `These are the current settings for \`${message.guild.name}\``
        )
        .addField("Event", event, true)
        .addField("Claim messages", toggle, true)
        .addField("Spawn logs", logs, true);
      /*.addField(
          "Spawn roles",
          roleQuery.length === 0 ? "No roles set" : roleArray,
          true
        )*/

      return message.channel.send(embed);
    });
  },
  info,
};

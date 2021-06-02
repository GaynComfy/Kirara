const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");

const info = {
  name: "settings",
  matchCase: false,
  category: "Administration",
};
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      let data = await instance.database.simpleQuery(
          "SERVERS",
          {
              guild_id: message.guild.id,
          }
      ).rows[0];

      const serverId = Number.parseInt(data.id);
      const roleQuery = await instance.database.simpleQuery("CARD_ROLES", {
        server_id: serverId,
      }).rows;
      let roleArray = roleQuery.map(a => `${a.tier}: <@&${a.role_id}>`)

      const query = {
        key: "claim:enabled",
        value: "true",
        server_id: instance.serverIds[message.guild.id],
        guild_id: message.guild.id,
      };
      const result = await instance.database.simpleQuery("SETTINGS", query);
      const toggle = result.rows.length === 0 ? "off" : "on";

      let logChn = instance.guilds[message.guild.id].log_channel;
      let logID = `<#${logChn}>`;
      let logs = "ON";
      if(!logChn) {
        logID = '`No log channel set`';
        logs = "OFF"; 
      }

      const embed = new MessageEmbed()
      .setAuthor("Kirara", "https://cdn.comfy.gay/a/kMjAyMC0wMQ.png")
      .setColor(Color.white)
      .setDescription(`These are the current settings of the server \`${message.guild.name}\``)
      .addField("Event:", `\`${data.event}\``)
      .addField("Claim Messages:", `\`${toggle}\``)
      .addField("Logs:", `\`${logs}\``)
      .addField("Logs Channel:", `${logID}`)
      .addField("Roles:", roleArray, true);
      message.channel.send(embed);
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
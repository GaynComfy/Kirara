const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");
const emotes = {
  t1: "<:NewT1:781684991372689458>",
  t2: "<:NewT2:781684993071251476>",
  t3: "<:NewT3:781684993331953684>",
  t4: "<:NewT4:781684993449001011>",
  t5: "<:NewT5:781684993834352680>",
  t6: "<:NewT6:781684992937558047>",
};

const info = {
  name: "settings",
  matchCase: false,
  category: "Administration",
};
module.exports = {
  execute: async (instance, message /*args*/) => {
    return withRights(message.member, async () => {
      const {
        rows: [data],
      } = await instance.database.simpleQuery("SERVERS", {
        id: instance.serverIds[message.guild.id],
      });

      const serverId = Number.parseInt(data.id);
      const { rows: roleQuery } = await instance.database.simpleQuery(
        "CARD_ROLES",
        {
          server_id: serverId,
        }
      );
      let found = 0;
      const roleArray = Object.keys(emotes).map(tier => {
        const r = roleQuery.find(ro => ro.tier === tier);
        if (r) {
          found = found + 1;
          return `${emotes[tier]} ${tier.toUpperCase()}: <@&${r.role_id}>`;
        } else {
          return `${emotes[tier]} ${tier.toUpperCase()}: None`;
        }
      });

      const query = {
        key: "claim:enabled",
        value: "true",
        server_id: instance.serverIds[message.guild.id],
        guild_id: message.guild.id,
      };
      const result = await instance.database.simpleQuery("SETTINGS", query);
      const toggle = result.rows.length === 0 ? "off" : "on";
      const event = data.event ? "on" : "off";

      const logChn = instance.guilds[message.guild.id].log_channel;
      let logs = "off";
      if (logChn) {
        logs = `<#${logChn}>`;
      }

      const embed = new MessageEmbed()
        .setAuthor("Kirara", "https://cdn.comfy.gay/a/kMjAyMC0wMQ.png")
        .setColor(Color.white)
        .setDescription(
          `These are the current settings for \`${message.guild.name}\``
        )
        .addField("Event", event, true)
        .addField("Claim messages", toggle, true)
        .addField("Spawn logs", logs, true)
        .addField(
          "Spawn roles",
          found === 0 ? "No roles set" : roleArray,
          true
        );
      return message.channel.send(embed);
    });
  },
  info,
  help: {
    usage: "settings",
    examples: ["settings"],
    description: "View the server settings!",
  },
};

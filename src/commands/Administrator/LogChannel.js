const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "logs",
  aliases: ["log"],
  matchCase: false,
  category: "Administration",
};
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length === 0 && message.mentions.channels.size === 0) {
        return false;
      }
      const embed = new MessageEmbed().setColor("RANDOM");
      if (args.length === 1 && args[0] === "off") {
        await instance.database.simpleUpdate(
          "SERVERS",
          {
            guild_id: message.guild.id,
          },
          {
            log_channel: null,
          }
        );
        delete instance.logChannels[message.guild.id];
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Logs Channel removed!`
        );
      }
      if (message.mentions.channels.size === 1) {
        const { id, name } = message.mentions.channels.first();
        await instance.database.simpleUpdate(
          "SERVERS",
          {
            guild_id: message.guild.id,
          },
          {
            log_channel: id,
          }
        );
        instance.logChannels[message.guild.id] = id;
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Logs Channel Set to ${name}!`
        );
      }
      message.channel.send(embed);
      return true;
    });
  },
  info,
  help: {
    usage: "logs [#channel]",
    examples: ["logs #asn-shoob-logs", "log"],
    description: "Set Waifu Spawn Channel to your Server!",
  },
};

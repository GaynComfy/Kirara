const { checkPerms, withRights } = require("../../utils/hooks");
const Color = require("../../utils/Colors.json");
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
        instance.guilds[message.guild.id].log_channel = null;
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Logs Channel removed!`
        );
      }
      if (message.mentions.channels.size === 1) {
        const chn = message.mentions.channels.first();
        if (
          (await checkPerms(instance, chn, ["SEND_MESSAGES", "EMBED_LINKS"]))
            .length > 0
        ) {
          embed
            .setColor(Color.red)
            .setDescription(
              `<:Sirona_NoCross:762606114444935168> I don't have permission to send messages to <#${chn.id}>.`
            );
        }
        await instance.database.simpleUpdate(
          "SERVERS",
          {
            guild_id: message.guild.id,
          },
          {
            log_channel: chn.id,
          }
        );
        instance.guilds[message.guild.id].log_channel = chn.id;
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Logs Channel set to <#${chn.id}>!`
        );
      }
      return message.channel.send(embed);
    });
  },
  info,
  help: {
    usage: "logs [#channel]",
    examples: ["logs #asn-shoob-logs", "log"],
    description: "Set Shoob log channel on your server!",
  },
};

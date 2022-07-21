const { checkPerms, withRights } = require("../../utils/hooks");
const Color = require("../../utils/Colors.json");
const { EmbedBuilder } = require("discord.js");

const info = {
  name: "logs",
  aliases: ["log"],
  matchCase: false,
  category: "Administration",
};
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      const embed = new EmbedBuilder().setColor("Random");

      if (args.length === 0) {
        const logChn = instance.guilds[message.guild.id].log_channel;
        if (logChn) {
          embed.setDescription(
            `<a:Sirona_loading:748854549703426118> Logs channel is set to <#${logChn}>.`
          );
        } else {
          embed.setDescription(
            `<a:Sirona_loading:748854549703426118> No logs channel set.`
          );
        }
      } else if (args.length === 1 && args[0] === "off") {
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
          `<a:Sirona_Tick:749202570341384202> Logs channel removed!`
        );
      } else if (message.mentions.channels.size === 1) {
        const chn = message.mentions.channels.first();
        if (
          (await checkPerms(instance, chn, ["SendMessages", "EmbedLinks"]))
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
          `<a:Sirona_Tick:749202570341384202> Logs channel set to <#${chn.id}>!`
        );
      } else return false;

      return message.channel.send({ embeds: [embed] });
    });
  },
  info,
  help: {
    usage: "logs [#channel]",
    examples: ["logs #asn-shoob-logs", "log"],
    description: "Set Shoob log channel on your server!",
  },
};

const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "prefix",
  matchCase: false,
  category: "Administration",
};
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      const embed = new MessageEmbed().setColor("RANDOM");

      if (args.length === 0) {
        const prefix =
          instance.guilds[message.guild.id].prefix || instance.config.prefix;
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Prefix is currently set to \`${prefix}\``
        );
      } else if (args.length === 1) {
        const prefix =
          args[0].toLowerCase() !== instance.config.prefix.toLowerCase()
            ? args[0]
            : null;
        await instance.database.simpleUpdate(
          "SERVERS",
          {
            guild_id: message.guild.id,
          },
          {
            prefix,
          }
        );
        instance.guilds[message.guild.id].prefix = prefix;
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> Prefix has been set to \`${args[0]}\`!`
        );
      } else {
        return false;
      }
      return message.channel.send(embed);
    });
  },
  info,
  help: {
    usage: "prefix [prefix]",
    examples: ["prefix k!", "prefix"],
    description: "Change the bot's prefix",
  },
};

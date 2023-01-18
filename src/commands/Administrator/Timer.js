const { withRights } = require("../../utils/hooks");
const { EmbedBuilder } = require("discord.js");

const info = {
  name: "timer",
  matchCase: false,
  category: "Administration",
  perms: ["ReadMessageHistory"],
};
const allowed = ["on", "off"];
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (
        (args.length > 0 && !allowed.includes(args[0].toLowerCase())) ||
        args.length > 1
      )
        return false;
      const embed = new EmbedBuilder().setColor("Random");

      if (args.length === 0) {
        const toggle = instance.guilds[message.guild.id].timer ? "on" : "off";
        embed.setDescription(
          `<a:Sirona_loading:748854549703426118> The spawn timer is ${toggle}.`
        );
      } else {
        const newState = args[0].toLowerCase() === "on";
        await instance.database.simpleUpdate(
          "SERVERS",
          {
            guild_id: message.guild.id,
          },
          {
            timer: newState,
          }
        );
        instance.guilds[message.guild.id].timer = newState;
        embed.setDescription(
          `<a:Sirona_Tick:749202570341384202> I have successfully turned ${args[0].toLowerCase()} the timer!`
        );
      }
      await message.channel.send({ embeds: [embed] });
      return true;
    });
  },
  info,
  help: {
    usage: "timer [on/off]",
    examples: ["timer on", "timer"],
    description: "Toggle the timer for Shoob card spawns!",
  },
};

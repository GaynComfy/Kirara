const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "event",
  matchCase: false,
  category: "Administration",
  usage: "event <start|on|off|end>",
  examples: ["event"],
  description: "Set a Shoob claiming event counter on your server!",
};
const allowed = ["start", "on", "end", "off"];
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length === 0 || !allowed.includes(args[0].toLowerCase())) {
        return false;
      }
      const arg = args[0].toLowerCase();
      const newState = arg === "on" || arg === "start";
      const update = {
        event: newState,
      };
      if (newState) update.event_time = new Date();
      await instance.database.simpleUpdate(
        "SERVERS",
        {
          guild_id: message.guild.id,
        },
        update
      );
      instance.guilds[message.guild.id] = {
        ...instance.guilds[message.guild.id],
        ...update,
      };
      const embed = new MessageEmbed()
        .setDescription(
          newState
            ? "<:Flame:783439293506519101> A new event for this server has just started!"
            : "<:Flame:783439293506519101> The event of this server just ended!"
        )
        .setColor("RANDOM");
      message.channel.send({ embed: embed });
      return true;
    });
  },
  info,
};

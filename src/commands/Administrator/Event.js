const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "event",
  matchCase: false,
  category: "Administration",
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
      const embed = new MessageEmbed()
        .setDescription(
          newState
            ? "<:T6:754541597479403612> A new event for this server has just started!"
            : "<:T6:754541597479403612> The event of this server just ended!"
        )
        .setColor("RANDOM");
      message.channel.send({ embed: embed });
      return true;
    });
  },
  info,
  help: {
    usage: "event <start|on|off|end>",
    examples: ["event"],
    description: "Set a claiming event counter on your server!",
  },
};

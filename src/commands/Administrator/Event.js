const { withRights } = require("../../utils/hooks");
const { EmbedBuilder } = require("discord.js");

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
      let time;
      if (arg === "start-timed") {
        if (args.length === 1) return false;
        time = Number.parseInt(args[1]);
        if (Number.isNaN(time)) return false;
      }
      const newState = arg === "on" || arg === "start" || arg === "start-timed";
      const update = {
        event: newState,
      };
      if (newState) update.event_time = new Date();
      else delete instance.timedEvents[message.guild.id];
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
      if (arg === "start-timed")
        instance.timedEvents[message.guild.id] = {
          val: Date.now() + time * 1000,
          channel: message.channel.id,
        };
      const embed = new EmbedBuilder()
        .setDescription(
          newState
            ? "<:Flame:783439293506519101> A new event for this server has just started!"
            : "<:Flame:783439293506519101> The event of this server just ended!"
        )
        .setColor("RANDOM");
      return await message.channel.send({ embeds: [embed] });
    });
  },
  info,
  help: {
    usage: "event <start|on|off|end> [seconds]",
    examples: ["event"],
    description:
      "Set a Shoob claiming event counter on your server!\nWhen using start-timed, provide the amount of seconds the event is supposed to last, it will end after that.",
  },
};

const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");

const info = {
  name: "timer",
  matchCase: false,
  category: "Administration",
  disabled: true
};
const allowed = ["on", "off"];
module.exports = {
  execute: async (instance, message, args) => {
    return withRights(message.member, async () => {
      if (args.length === 0 || !allowed.includes(args[0].toLowerCase()))
        return false;
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
      const embedz = new MessageEmbed()
        .setDescription(
          "<a:Sirona_Tick:749202570341384202> I have successfully turned `" +
            args[0] +
            "` the timer!"
        )
        .setColor("RANDOM");
      message.channel.send({ embed: embedz });
      return true;
    });
  },
  info,
  help: {
    usage: "timer <on/off>",
    examples: ["timer on"],
    description: "Toggle the timer!",
  },
};

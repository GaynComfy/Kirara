const { MessageEmbed } = require("discord.js");
const info = {
  name: "trlb-optout",
  matchCase: false,
  category: "Information",
};

module.exports = {
  execute: async (instance, message) => {
    const { id } = message.author;
    const {rows: [setting] } = await instance.database.simpleQuery("USER_SETTINGS", {
      discord_id: id,
      key: "trlboptout"
    });
    if(args.length === 0) {
      message.reply(`Your status of not displaying on the TypeRacer LeaderBoard: ${setting ? "Yes" : "No"}\nThis setting is used to control if you do not want to show up on the leaderboard.`);
    } else if (args.length === 1) {
      const arg = args[0].toLowerCase();
      if(arg === "yes") {
        if(!setting) {
          message.reply("You succesfully opted out/");
            instance.database.simpleInsert("USER_SETTINGS", {
              discord_id: id,
              key: "trlboptout",
              value: 'y'
            });
        } else {
          message.reply("You are already opted out");
        }
      } else if(arg === "no") {
        if(setting) {
          await instance.database.simpleDelete("USER_SETTINGS", {
            id: setting.id
          });
        }
        message.reply(setting ? "You are opted in again!" : "you are not opt out!");
      } else
        return false;
    } else
      return false;

    return true;
  },
  info,
  help: {
    usage: "trlb-optout <yes|no|cancel>",
    examples: ["uwu"],
    description: "Use to see & change if you are opt out of type racer's leaderboard.",
  },
};

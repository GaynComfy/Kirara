const { MessageEmbed } = require("discord.js");
const info = {
  name: "trlb-optout",
  matchCase: false,
  category: "Information",
};

const deleteOperations = {};

const embed = new MessageEmbed().setDescription("UwU").setColor("RANDOM");
module.exports = {
  execute: async (instance, message) => {
    const { id } = message.author;
    const {rows: [setting] } = await instance.database.simpleQuery("USER_SETTINGS", {
      discord_id: id,
      key: "trlboptout"
    });
    if(args.length === 0) {
      message.reply(`Your status of not displaying on the TypeRacer LeaderBoard: ${setting ? "Yes" : "No"}\nThis setting is used to control if you do not want to show up on the leaderboard!\n**NOTE**: If you choose yes, you have 30 seconds to cancel, otherwise all entries will be deleted`);
    } else if (args.length === 1) {
      const arg = args[0].toLowerCase();
      if(arg === "yes") {
        if(deleteOperations[id]) return true;
        if(!setting) {
          message.reply("You succesfully opted out, if you do NOT type the command again with `cancel` as argument within 30 seconds in THIS channel or this server wherever the bot can read all your entries will be deleted, performing this on another server with kirara will NOT work!");
          deleteOperations[id] = setTimeout(() => {
            instance.database.simpleInsert("USER_SETTINGS", {
              discord_id: id,
              key: "trlboptout",
              value: 'y'
            });

            instance.database.simpleDelete("TYPERACE_STATS", {
              discord_id: id,
            });
            delete deleteOperations[id];
          }, 35 * 1000); // 35 secs
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
      } else if(arg === "cancel") {
        if(deleteOperations[id]) {
          clearTimeout(deleteOperations[id]);
          delete deleteOperations[id];
          message.reply("Canceled the opt out");
        }
      }
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

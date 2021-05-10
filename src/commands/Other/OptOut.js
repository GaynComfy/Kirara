const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");
const info = {
  name: "lb-optout",
  aliases: ["optout"],
  matchCase: false,
  category: "Information",
};

module.exports = {
  execute: async (instance, message, args) => {
    const embed = new MessageEmbed().setColor(Color.default);
    const prefix =
      instance.guilds[message.guild.id].prefix || instance.config.prefix;
    const { id: discord_id } = message.author;
    const {
      rows: [setting],
    } = await instance.database.simpleQuery("USER_SETTINGS", {
      discord_id,
      key: "lb-optout",
    });

    if (args.length === 0) {
      const status = setting ? "opted out" : "opted in";
      const toggle = setting ? "no" : "yes";
      embed.setDescription(
        `<a:Sirona_loading:748854549703426118> <@!${discord_id}> is currently \`${status}\` on leaderboards.\n\n` +
          `<a:Sirona_star:748985391360507924> You can use \`${prefix}lb-optout ${toggle}\` to toggle this.`
      );
    } else if (args.length === 1) {
      const arg = args[0].toLowerCase();

      if (arg === "yes") {
        if (!setting)
          await instance.database.simpleInsert("USER_SETTINGS", {
            discord_id,
            key: "lb-optout",
            value: "y",
          });
      } else if (arg === "no") {
        if (setting)
          await instance.database.simpleDelete("USER_SETTINGS", {
            id: setting.id,
          });
      } else return false;

      const status = setting ? "opted in" : "opted out";
      embed
        .setDescription(
          `<a:Sirona_Tick:749202570341384202> <@!${discord_id}> is now \`${status}\` from leaderboards.`
        )
        .setColor("RANDOM");
    } else return false;

    return message.channel.send(embed);
  },
  info,
  help: {
    usage: "lb-optout [yes/no]",
    examples: ["lb-optout yes", "lb-optout no"],
    description:
      "Use to see & change if you are opted out of global leaderboards",
  },
};

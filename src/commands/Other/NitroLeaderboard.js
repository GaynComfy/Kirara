const { MessageEmbed } = require("discord.js");
const humanizeDuration = require("humanize-duration");
const { pageThroughCollection } = require("../../utils/PagedResults");
const Constants = require("../../utils/Constants.json");

const info = {
  name: "boosters",
  aliases: ["nitrolb", "nitroleaderboard"],
  matchCase: false,
  category: "UwU",
  cooldown: 2,
  perms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
  disabled: process.env.NODE_ENV !== "development",
};
module.exports = {
  execute: async (instance, message) => {
    message.channel.startTyping();

    // intent will only work on verified bot
    return message.guild.members
      .fetch()
      .then(allMembers => {
        const allBoosters = allMembers
          .filter(member => member.premiumSinceTimestamp)
          .sorted(
            (first, second) =>
              first.premiumSinceTimestamp - second.premiumSinceTimestamp
          );

        message.channel.stopTyping();

        if (allBoosters.size === 0) {
          const embed = new MessageEmbed()
            .setDescription("\uD83D\uDCA2 Nobody is boosting this server!")
            .setColor("#ff1100");
          return message.channel.send(embed);
        }

        return pageThroughCollection(message, allBoosters, (boosters, page) => {
          const offset = page.index * page.perPage;

          return new MessageEmbed()
            .setAuthor(
              `Server Boost Leaderboard in ${message.guild.name}`,
              message.guild.iconURL({ dynamic: true })
            )
            .setColor(Constants.color)
            .setDescription(
              boosters.map(
                (member, index) =>
                  `${offset + index + 1}. ${member} *(${humanizeDuration(
                    Date.now() - member.premiumSinceTimestamp,
                    { round: true, units: ["y", "mo", "w", "d", "h", "m"] }
                  )})*`
              )
            )
            .setFooter(
              (page.total > 1
                ? `Page: ${page.index + 1}/${page.total} | `
                : "") +
                (page.index + 1 < page.total
                  ? "React ▶️ for next page | "
                  : "") +
                (page.total > 1 ? "React ◀️ to go back" : "")
            );
        });
      })
      .catch(err => {
        console.log(err);
        message.channel.stopTyping();
        throw err;
      });
  },
  info,
  help: {
    usage: "boosters",
    examples: ["boosters"],
    description: "Show the server boosters leaderboard.",
  },
};

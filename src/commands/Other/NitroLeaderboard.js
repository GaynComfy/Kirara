const { EmbedBuilder } = require("discord.js");
const humanizeDuration = require("humanize-duration");
const { pageThroughCollection } = require("../../utils/PagedResults");
const Constants = require("../../utils/Constants.json");

const info = {
  name: "boosters",
  aliases: ["nitrolb", "nitroleaderboard"],
  matchCase: false,
  category: "UwU",
  cooldown: 2,
  perms: ["AddReactions", "ManageMessages", "ReadMessageHistory"],
};
module.exports = {
  execute: async (instance, message) => {
    message.channel.sendTyping().catch(() => null);

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

        if (allBoosters.size === 0) {
          const embed = new EmbedBuilder()
            .setDescription("\uD83D\uDCA2 Nobody is boosting this server!")
            .setColor("#ff1100");
          return message.channel.send({ embeds: [embed] });
        }

        return pageThroughCollection(message, allBoosters, (boosters, page) => {
          const offset = page.index * page.perPage;

          return new EmbedBuilder()
            .setAuthor({
              name: `Server Boost Leaderboard in ${message.guild.name}`,
              iconURL: message.guild.iconURL({ dynamic: true }),
            })
            .setColor(Constants.color)
            .setDescription(
              boosters
                .map(
                  (member, index) =>
                    `${offset + index + 1}. ${member} *(${humanizeDuration(
                      Date.now() - member.premiumSinceTimestamp,
                      { round: true, units: ["y", "mo", "w", "d", "h", "m"] }
                    )})*`
                )
                .join("\n")
            )
            .setFooter({
              text:
                (page.total > 1
                  ? `Page: ${page.index + 1}/${page.total} | `
                  : "឵") +
                (page.index + 1 < page.total
                  ? "React ▶️ for next page | "
                  : "") +
                (page.total > 1 ? "React ◀️ to go back" : ""),
            });
        });
      })
      .catch(err => {
        console.log(err);
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

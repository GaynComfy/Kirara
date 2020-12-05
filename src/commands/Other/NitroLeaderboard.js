const { MessageEmbed } = require("discord.js");
const humanizeDuration = require("humanize-duration");
const { pageThroughCollection } = require("../../utils/PagedResults");
const info = {
  name: "boosters",
  aliases: ["nitrolb", "nitroleaderboard"],
  matchCase: false,
  category: "UwU",
  cooldown: 2,
};

module.exports = {
  execute: async (instance, message, args) => {
    message.channel.startTyping();
    //intent will only work on verified bot
    message.guild.members
      .fetch()
      .then((allMembers) => {
        const allBoosters = allMembers
          .filter((member) => member.premiumSinceTimestamp)
          .sorted(
            (first, second) =>
              first.premiumSinceTimestamp - second.premiumSinceTimestamp
          );

        message.channel.stopTyping();

        if (allBoosters.size === 0) {
          const embed = new MessageEmbed()
            .setDescription("\uD83D\uDCA2 Nobody is boosting this server!")
            .setColor("#ff1100");
          message.channel.send(embed);
          return;
        }

        pageThroughCollection(message, allBoosters, (boosters, page) => {
          const offset = page.index * page.perPage;

          return new MessageEmbed()
            .setTitle(
              `Server Boost Leaderboard | ${page.index + 1}/${page.total} | ${
                message.guild.name
              }`
            )
            .setDescription(
              boosters.map(
                (member, index) =>
                  `${
                    offset + index + 1
                  }. ${member} *(${humanizeDuration(
                    Date.now() - member.premiumSinceTimestamp,
                    { round: true, units: ["y", "mo", "w", "d", "h", "m"] }
                  )})*`
              )
            )
            .setColor("#ba30ba");
        });
      })
      .catch((err) => {
        console.log(err);
        message.channel.stopTyping();
      });
  },
  info,
  help: {
    usage: "boosters",
    examples: ["boosters"],
    description: "Show the server boosters leaderboard.",
  },
};

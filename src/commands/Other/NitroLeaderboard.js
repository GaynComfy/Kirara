const { MessageEmbed } = require("discord.js");
const moment = require("moment");
const { pageThroughCollection } = require("../../utils/PagedResults");
const info = {
  name: "NitroLeaderboard",
  aliases: ["boosters"],
  matchCase: false,
  category: "UwU",
  cooldown: 2,
};

module.exports = {
  execute: async (instance, message, args) => {
    message.channel.startTyping();
    console.log("fetching");
    message.guild.members
      .fetch()
      .then((allMembers) => {
        console.log("done");
        const allBoosters = allMembers
          .filter((member) => member.premiumSinceTimestamp)
          .sorted(
            (first, second) =>
              first.premiumSinceTimestamp - second.premiumSinceTimestamp
          );
        console.log(allBoosters);

        message.channel.stopTyping();

        if (allBoosters.size === 0) {
          message.channel.send(
            "\uD83D\uDCA2 **Nobody is boosting this server!**"
          );
          return;
        }

        return pageThroughCollection(message, allBoosters, (boosters, page) => {
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
                  `${offset + index + 1}. ${member} *(${moment(
                    Date.now() - member.premiumSinceTimestamp
                  ).fromNow()})*`
              )
            )
            .setColor("#ba30ba");
        });
      })
      .catch(() => {
        message.channel.stopTyping();
      });
  },
  info,
  help: {
    usage: "boosters",
    examples: ["boosters"],
    description: "Show the server booster leaderboard.",
  },
};

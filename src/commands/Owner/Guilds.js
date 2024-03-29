const { EmbedBuilder } = require("discord.js");
const { withOwner } = require("../../utils/hooks");
const { pageThroughList } = require("../../utils/PagedResults");
const Constants = require("../../utils/Constants.json");

const info = {
  name: "guildlist",
  aliases: ["guilds", "gl"],
  matchCase: false,
  category: "Owner",
  ownerOnly: true,
  cooldown: 5,
};

module.exports = {
  execute: async (instance, message) => {
    return withOwner(
      message.author.id,
      async () => {
        const eachShardGuilds = await instance.client.shard.broadcastEval(
          client =>
            client.guilds.cache.map(g => ({
              name: g.name,
              count: g.memberCount,
            }))
        );
        const guilds = eachShardGuilds.flat().sort((a, b) => b.count - a.count);

        await pageThroughList(message, guilds, (chunk, page) => {
          const formatted = chunk.map(g => `${g.name} => ${g.count}`);

          return new EmbedBuilder()
            .setTitle(
              `**${instance.client.user.tag} | Guilds page ${page.index + 1}/${
                page.total
              }:**`
            )
            .setColor(Constants.color)
            .setDescription("```" + formatted.join("\n") + "```");
        });
        return true;
      },
      instance.config.owner
    );
  },
  info,
  help: {
    usage: "guilds",
    examples: ["guilds"],
    description: "Display Bot Joined Guilds",
  },
};

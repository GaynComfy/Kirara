const { MessageEmbed } = require("discord.js");
const { withOwner } = require("../../utils/hooks");
const { pageThroughList } = require("../../utils/PagedResults");

const info = {
  name: "guildlist",
  aliases: ["guilds", "gl"],
  matchCase: false,
  category: "Owner",
  cooldown: 5,
};

module.exports = {
  execute: async (instance, message, args) => {
    return withOwner(
      message.author.id,
      async () => {
        const eachShardGuilds = await instance.client.shard.broadcastEval(
          "this.guilds.cache.map(g => ({ name: g.name, count: g.memberCount }))"
        );
        const guilds = eachShardGuilds.flat().sort((a, b) => b.count - a.count);

        return pageThroughList(message, guilds, (chunk, page) => {
          const formatted = chunk.map((g) => `${g.name} => ${g.count}`);

          return new MessageEmbed()
            .setTitle(
              `**${instance.client.user.tag} | Guilds page ${page.index + 1}/${
                page.total
              }:**`
            )
            .setDescription("```" + formatted.join("\n") + "```")
            .setColor("RANDOM");
        });
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

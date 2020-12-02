const redis = require("redis");
const Discord = require("discord.js");
const GuildDelete = require("../events/GuildDelete");
const { tierInfo } = require("../utils/cardUtils");
const tierSettings = {
  1: { emoji: "<:NewT1:781684991372689458>", num: 1, color: "#e8e8e8" },
  2: { emoji: "<:NewT2:781684993071251476>", num: 2, color: "#2ed60d" },
  3: { emoji: "<:NewT3:781684993331953684>", num: 3, color: "#1a87ed" },
  4: { emoji: "<:NewT4:781684993449001011>", num: 4, color: "#a623a6" },
  5: { emoji: "<:NewT5:781684993834352680>", num: 5, color: "#ffe814" },
  6: { emoji: "<:NewT6:781684992937558047>", num: 6, color: "#ff170f" },
};

let client = null;
module.exports = {
  start: async (instance) => {
    const { config, settings } = instance;
    client = redis.createClient(
      `redis://${config.cache.host}:${config.cache.port}`
    );
    client.subscribe("auctions");
    client.on("message", async (channel, message) => {
      if (channel === "auctions") {
        const data = JSON.parse(message);
        const embed = new Discord.MessageEmbed()
          .setAuthor(
            "Shoob",
            "https://cdn.animesoul.com/images/content/shoob/shoob-no-empty-space.png"
          )
          .setTimestamp()
          .setTitle(`> New Auction on AnimeSoul! <`)
          .setURL(`https://animesoul.com/auction/${data.id}`)
          .setDescription(`New Auction for ${data.card_name} T${data.tier}`);

        for (const guild of instance.client.guilds.cache.array()) {
          if (instance.logChannels[guild.id]) {
            const logChannel = guild.channels.cache.get(
              instance.logChannels[guild.id]
            );
            if (logChannel) {
              const {
                rows: [roleResult],
              } = await instance.database.simpleQuery("CARD_ROLES", {
                server_id: instance.serverIds[guild.id],
                tier: `t${data.tier}`,
              });
              if (roleResult) {
                await message.channel.send(
                  `${tierInfo[`T${data.tier.toUpperCase()}`].emoji} <@&${
                    roleResult.role_id
                  }> | \`${
                    data.card_name
                  } T${data.tier.toUpperCase()} has went on auction!\`\nhttps://animesoul.com/auction/${
                    data.id
                  }`
                );
              } else {
                embed.setFooter(guild.name);
                await logChannel.send(embed);
              }
            }
          }
        }
      }
    });
  },
  stop: async (instance) => {
    if (client !== null) {
      client.removeAllListeners("message");
      client.end(true);
      client = null;
    }
  },
};

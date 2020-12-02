const redis = require("redis");
const Discord = require("discord.js");
const GuildDelete = require("../events/GuildDelete");
const Fetcher = require("../utils/CardFetcher");
const { tierInfo } = require("../utils/cardUtils");
const tierSettings = {
  1: { emoji: "<:NewT1:781684991372689458>", num: 1, color: "#e8e8e8" },
  2: { emoji: "<:NewT2:781684993071251476>", num: 2, color: "#2ed60d" },
  3: { emoji: "<:NewT3:781684993331953684>", num: 3, color: "#1a87ed" },
  4: { emoji: "<:NewT4:781684993449001011>", num: 4, color: "#a623a6" },
  5: { emoji: "<:NewT5:781684993834352680>", num: 5, color: "#ffe814" },
  6: { emoji: "<:NewT6:781684992937558047>", num: 6, color: "#ff170f" },
};
const allowed = ["3", "4", "5", "6", "S"];
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
        if (!allowed.includes(data.tier)) return;
        const tier = tierSettings[data.tier];
        const card = await Fetcher.fetchByID(instance, data.card_id);
        const embed = new Discord.MessageEmbed()
          .setTitle(`> <:Shoob:783624812160876555> Enter the Auction`)
          .setURL(`https://animesoul.com/auction/${data.id}`)
          .setColor(tier.color)
          .setThumbnail(encodeURI(card.image_url).replace(".webp", ".gif"))
          .setDescription(
            `${tier.emoji} [${data.card_name} T${data.tier}]` +
              `(https://animesoul.com/cards/info/${data.card_id}) V${data.version} is being auctioned!`
          )
          .addField(
            "Starting Bid",
            `富${Math.round(data.bn / 5) + data.minimum}`,
            true
          )
          .addField("Buy Now", `富${data.bn}`, true)
          .addField("Min. Increment", `+富${data.minimum}`, true);

        for (const guild of instance.client.guilds.cache.array()) {
          const {
            rows: [result],
          } = await instance.database.simpleQuery("SETTINGS", {
            key: "notif_channel",
            guild_id: guild.id,
          });
          if (!result) continue;
          const logChannel = guild.channels.cache.get(result.value);
          if (logChannel) {
            try {
              await logChannel.send(embed);
            } catch (err) {
              console.log("failed to send message");
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

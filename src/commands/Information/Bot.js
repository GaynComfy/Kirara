const { withRights } = require("../../utils/hooks");
const { MessageEmbed } = require("discord.js");
const isDev = process.env.NODE_ENV === "development";

const info = {
  name: "bot",
  matchCase: false,
  category: "Information",
};
const numberWithCommas = (entry) =>
  entry.toLocaleString(undefined, {
    style: "decimal",
    maximumFractionDigits: 0,
  });
const fetchData = async (instance) => {
  if (await instance.cache.exists("botstats:latest")) {
    const cached = await instance.cache.get("botstats:latest");
    return JSON.parse(cached);
  }
  const { cache } = instance;
  const promises = [
    instance.client.shard.fetchClientValues("guilds.cache.size"),
    instance.client.shard.broadcastEval(
      "this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)"
    ),
    instance.client.shard.broadcastEval(
      "this.guilds.cache.map((guild) => guild.channels.cache.size)"
    ),
  ];
  const results = await Promise.all(promises);
  const totalGuilds = results[0].reduce(
    (acc, guildCount) => acc + guildCount,
    0
  );
  const totalMembers = results[1].reduce(
    (acc, memberCount) => acc + memberCount,
    0
  );
  let channels = results[2].flat(5);
  channels = channels.reduce((a, b) => a + b, 0);

  const obj = {
    totalGuilds,
    totalMembers,
    channels,
  };
  // no need to await this, we just want it saved
  cache.setExpire("botstats:latest", JSON.stringify(obj), 120);
  return obj;
};
module.exports = {
  execute: async (instance, message, args) => {
    try {
      const { totalGuilds, totalMembers, channels } = await fetchData(instance);
      const shardid = instance.client.shard.ids[0] + 1;
      const guildSize = instance.client.guilds.cache.size;
      const userSize = instance.client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0
      );
      const channelSize = instance.client.channels.cache.size;
      const InviteEmbed = new MessageEmbed()
        .setAuthor("Info for Sirona")
        .setDescription(
          `🏓Latency is ${
            Date.now() - message.createdTimestamp
          }ms. API Latency is ${Math.round(instance.client.ws.ping)}ms`
        )
        .addField(
          "**🖥️ Bot Details:**",
          `${numberWithCommas(totalGuilds)} Servers\n${numberWithCommas(
            totalMembers
          )} Users\n${numberWithCommas(channels)} Channels`
        )
        .addField(
          `**🟢 Shard: ${shardid}**`,
          `${numberWithCommas(guildSize)} Servers\n${numberWithCommas(
            userSize
          )} Users\n${numberWithCommas(channelSize)} Channels`
        )
        .setColor("#e0e0e0");

      message.channel.send({ embed: InviteEmbed });
    } catch (err) {
      console.log(err);
    }
  },
  info,
  help: {
    usage: "bot",
    examples: ["bot"],
    description: "Check bot stats!",
  },
};

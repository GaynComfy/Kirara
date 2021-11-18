const { MessageEmbed } = require("discord.js");
const { getLilliePing } = require("./utils");
const { version } = require("../../../package.json");
const Constants = require("../../utils/Constants.json");

const info = {
  name: "bot",
  matchCase: false,
  category: "Information",
  usage: "bot",
  examples: ["bot"],
  description: "Check bot stats!",
};
const numberWithCommas = entry =>
  entry.toLocaleString(undefined, {
    style: "decimal",
    maximumFractionDigits: 0,
  });
const fetchData = async instance => {
  if (await instance.cache.exists("botstats:latest")) {
    const cached = await instance.cache.get("botstats:latest");
    return JSON.parse(cached);
  }
  const { cache } = instance;
  const promises = [
    instance.client.shard.fetchClientValues("guilds.cache.size"),
    instance.client.shard.broadcastEval(client =>
      client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
    ),
    instance.client.shard.broadcastEval(client =>
      client.guilds.cache.map(guild => guild.channels.cache.size)
    ),
    instance.client.shard.fetchClientValues("b_instance.asClaims"),
    instance.client.shard.fetchClientValues("b_instance.kClaims"),
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
  const channels = results[2].flat(5).reduce((a, b) => a + b, 0);

  const asClaims = results[3].reduce((acc, cc) => acc + cc, 0);
  const kClaims = results[4].reduce((acc, cc) => acc + cc, 0);

  const obj = {
    totalGuilds,
    totalMembers,
    channels,
    asClaims,
    kClaims,
  };
  // no need to await this, we just want it saved
  cache.setExpire("botstats:latest", JSON.stringify(obj), 120);
  return obj;
};
module.exports = {
  execute: async (instance, message) => {
    try {
      const ping = Date.now() - message.createdTimestamp;
      const lillie = await getLilliePing();
      const { totalGuilds, totalMembers, channels, asClaims, kClaims } =
        await fetchData(instance);
      const shardid = instance.client.shard.ids[0] + 1;
      const guildSize = instance.client.guilds.cache.size;
      const userSize = instance.client.guilds.cache.reduce(
        (acc, guild) => acc + guild.memberCount,
        0
      );
      const channelSize = instance.client.channels.cache.size;
      const embed = new MessageEmbed()
        .setAuthor(`Kirara v${version}`)
        .setColor(Constants.color)
        .setDescription(
          `<:KiraraBoop:784849773291110460> [Invite me]` +
            `(https://discord.com/oauth2/authorize?client_id=748100524246564894&permissions=511040&scope=bot)\n` +
            `<a:KiraraHearto:775767859786809384> [Donate]` +
            `(https://donatebot.io/checkout/378599231583289346?buyer=${message.author.id})\n\n` +
            `🏓 Command: \`${ping}ms\`\n` +
            `💓 Gateway: \`${instance.client.ws.ping}ms\`\n` +
            `🖍️ midori: \`${lillie.ping}\`` +
            (lillie.version ? `, v${lillie.version}` : "")
        )
        .addField(
          "**🖥️ Bot Details**",
          `${numberWithCommas(totalGuilds)} Servers\n` +
            `${numberWithCommas(totalMembers)} Users\n` +
            `${numberWithCommas(channels)} Channels\n\n` +
            `${numberWithCommas(asClaims)} AS claims\n` +
            `${numberWithCommas(kClaims)} Kirara claims`,
          true
        )
        .addField(
          `**🟢 Shard ${shardid}**`,
          `${numberWithCommas(guildSize)} Servers\n` +
            `${numberWithCommas(userSize)} Users\n` +
            `${numberWithCommas(channelSize)} Channels\n\n` +
            `${numberWithCommas(instance.asClaims)} AS claims\n` +
            `${numberWithCommas(instance.kClaims)} Kirara claims`,
          true
        );

      return message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.log(err);
    }
  },
  info,
};

const { EmbedBuilder } = require("discord.js");
const { getMidoriPing } = require("./utils");
const { version } = require("../../../package.json");
const Constants = require("../../utils/Constants.json");

const FULL_BOT_NAME = `Kirara v${version}`;

const info = {
  name: "bot",
  matchCase: false,
  category: "Information",
};
const formatNumber = entry =>
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
  cache
    .setExpire("botstats:latest", JSON.stringify(obj), 120)
    .catch(console.error);
  return obj;
};
module.exports = {
  execute: async (instance, message) => {
    const ping = Date.now() - message.createdTimestamp;
    const midori = await getMidoriPing();
    const { totalGuilds, totalMembers, channels, asClaims, kClaims } =
      await fetchData(instance);
    const shardid = instance.client.shard.ids[0] + 1;
    const guildSize = instance.client.guilds.cache.size;
    const userSize = instance.client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );
    const channelSize = instance.client.channels.cache.size;
    const embed = new EmbedBuilder()
      .setAuthor({ name: FULL_BOT_NAME })
      .setColor(Constants.color)
      .setDescription(
        `<:KiraraBoop:784849773291110460> [Invite me]` +
          `(https://discord.com/oauth2/authorize?client_id=748100524246564894&permissions=511040&scope=bot)\n` +
          `<a:KiraraHearto:775767859786809384> [Donate]` +
          `(https://donatebot.io/checkout/378599231583289346?buyer=${message.author.id})\n\n` +
          `🏓 Command: \`${ping}ms\`\n` +
          `💓 Gateway: \`${instance.client.ws.ping}ms\`\n` +
          `🖍️ midori: \`${midori.ping}\`` +
          (midori.version ? `, v${midori.version}` : "")
      )
      .addFields([
        {
          name: "**🖥️ Bot Details**",
          value:
            `${formatNumber(totalGuilds)} Servers\n` +
            `${formatNumber(totalMembers)} Users\n` +
            `${formatNumber(channels)} Channels\n\n` +
            `${formatNumber(asClaims)} AS claims\n` +
            `${formatNumber(kClaims)} Kirara claims`,
          inline: true,
        },
        {
          name: `**🟢 Shard ${shardid}**`,
          value:
            `${formatNumber(guildSize)} Servers\n` +
            `${formatNumber(userSize)} Users\n` +
            `${formatNumber(channelSize)} Channels\n\n` +
            `${formatNumber(instance.asClaims)} AS claims\n` +
            `${formatNumber(instance.kClaims)} Kirara claims`,
          inline: true,
        },
      ]);

    await message.channel.send({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "bot",
    examples: ["bot"],
    description: "Check bot stats!",
  },
};

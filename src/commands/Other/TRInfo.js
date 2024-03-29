const { EmbedBuilder } = require("discord.js");
const Color = require("../../utils/Colors.json");
const {
  diffs,
  getCpm,
  userAllInfo,
  userInfo,
} = require("../../utils/typeRaceUtils");
const { mention, userId } = require("../../utils/regexUtils");
const info = {
  name: "typeraceinfo",
  aliases: ["tri", "trs"],
  matchCase: false,
  category: "UwU",
};

const initialDiffs = Object.keys(diffs);
const fullDiffs = Object.values(diffs);

module.exports = {
  execute: async (instance, message, args) => {
    let member =
      message.mentions.users.first() ||
      (args.length >= 1 &&
        (await instance.client.users.fetch(args[0]).catch(() => null)));
    if (args.length >= 1 && (mention.test(args[0]) || userId.test(args[0])))
      args.shift();
    if (!member) {
      member = message.author;
    }

    // build cute embed
    const embed = new EmbedBuilder()
      .setThumbnail(member.displayAvatarURL({ size: 2048, dynamic: true }))
      .setColor(Color.default);

    if (args.length === 0) {
      // get all stats
      const stats = await userAllInfo(instance, member.id);
      const cpm = [];
      let allCpm = 0;
      let total = 0;
      let won = 0;

      const fields = [];
      stats.diffs
        .filter(d => d.played)
        .reverse()
        .forEach(d => {
          const topCpm = getCpm(d.difficulty, d.top);
          const lastCpm = getCpm(d.difficulty, d.last);
          const dName =
            d.difficulty.charAt(0).toUpperCase() + d.difficulty.substring(1);
          fields.push({
            name: dName,
            value:
              `**Top**: \`${d.top}s\` (\`${topCpm} CPM\`) | **Last**: \`${d.last}s\` (\`${lastCpm} CPM\`)\n` +
              `**${d.total} ${
                d.total === 1 ? "game" : "games"
              }**, winning a total of **${d.first} ${
                d.first === 1 ? "game" : "games"
              }**! <:KiraraHugHeart:798460293491326986>`,
          });
          cpm.push(topCpm);
          total += d.total;
          won += d.first;
        });
      cpm.forEach(d => (allCpm += d));
      embed.addFields(fields);

      embed.setDescription(
        `<:Sirona_yesh:762603569538531328> **${member.username}'s Typerace stats**\n\n` +
          `**Total games**: \`${won}/${total} games\`` +
          (cpm.length >= 1
            ? `\n**Average CPM**: \`${Math.round(allCpm / cpm.length)} CPM\``
            : "")
      );
    } else {
      // get stats for a specific typerace
      const di = args.shift().toLowerCase();
      const iDi = di[0];
      const isDi = fullDiffs.includes(di);
      if (!fullDiffs.includes(di) && !initialDiffs.includes(iDi)) return false;
      const diff = isDi ? di : diffs[di];
      const stats = await userInfo(instance, member.id, diff);
      const dName = diff.charAt(0).toUpperCase() + diff.substring(1);

      const topCpm = getCpm(diff, stats.top);
      const lastCpm = getCpm(diff, stats.last);

      embed.setDescription(
        `<:Sirona_yesh:762603569538531328> **${member.username}'s ${dName} Typerace stats**\n\n` +
          (stats.played
            ? `**Total games**: \`${stats.first}/${stats.total} games\`\n` +
              `**Top record**: \`${stats.top}s\` (\`${topCpm} CPM\`)\n` +
              `**Last game**: \`${stats.last}s\` (\`${lastCpm} CPM\`)`
            : `No games yet!`)
      );
    }

    await message.channel.send({ embeds: [embed] });
    return true;
  },
  info,
  help: {
    usage: "typeraceinfo [@user] [shoob/collect/easy/medium/hard/impossible]",
    examples: ["tri", "tri @JeDaYoshi", "trs @Shiro i"],
    description: "See Type race stats!",
  },
};

const { MessageEmbed, MessageAttachment } = require("discord.js");
const Color = require("../../utils/Colors.json");
const {
  diffs,
  difficulty,
  userAllInfo,
  userInfo,
  getWpm,
} = require("../../utils/typeRaceUtils");

const info = {
  name: "typeraceinfo",
  aliases: ["tri", "trs"],
  matchCase: false,
  category: "UwU",
};

const mention = /<@!?(\d{17,19})>/;

module.exports = {
  execute: async (instance, message, args) => {
    let member = message.mentions.users.first();
    if (args.length >= 1 && mention.test(args[0])) args.shift();
    if (!member) {
      member = message.author;
    }
    if (args.length === 0) {
      // get all stats
      const stats = await userAllInfo(instance, member.id);
      const wpm = [];
      let allWpm = 0;
      let total = 0;
      let won = 0;

      // build cute embed
      const embed = new MessageEmbed()
        .setThumbnail(member.displayAvatarURL({ size: 2048, dynamic: true }))
        .setColor(Color.default);

      stats.diffs.forEach((d) => {
        if (d.played) {
          const topWpm = getWpm(d.difficulty, d.top);
          const lastWpm = getWpm(d.difficulty, d.last);
          const dName =
            d.difficulty.charAt(0).toUpperCase() + d.difficulty.slice(1);
          embed.addField(
            dName,
            `Top: \`${d.top}s\` (\`${topWpm} WPM\`) | Last: \`${d.last}s\` (\`${lastWpm} WPM\`)\n` +
              `**${d.total} games**, where has been first **${d.first}** times!`
          );
          wpm.push(topWpm);
          total += d.total;
          won += d.first;
        }
      });
      wpm.forEach((d) => (allWpm += d));

      embed.setDescription(
        `<:Sirona_yesh:762603569538531328> **${member.username}'s Typerace stats**\n` +
          `\nTotal games: \`${won}/${total} games\`` +
          (wpm.length >= 1
            ? `\nAverage WPM: \`${Math.round(allWpm / wpm.length)} WPM\``
            : ``)
      );

      await message.channel.send(embed);
      return true;
    } else {
      // get stats for a specific typerace
      const di = args.shift()[0].toLowerCase();
      if (!Object.keys(diffs).includes(di)) return false;
      const diff = diffs[di];
      const stats = await userInfo(instance, member.id, diff);
      const dName = diff.charAt(0).toUpperCase() + diff.slice(1);

      const topWpm = getWpm(diff, stats.top);
      const lastWpm = getWpm(diff, stats.last);

      // build cute embed
      const embed = new MessageEmbed()
        .setThumbnail(member.displayAvatarURL({ size: 2048, dynamic: true }))
        .setColor(Color.default)
        .setDescription(
          `<:Sirona_yesh:762603569538531328> **${member.username}'s ${dName} Typerace stats**\n` +
            (stats.played
              ? `\nTotal games: \`${stats.first}/${stats.total} games\`` +
                (stats.top > 0
                  ? `\nTop record: \`${stats.top}s\` (\`${topWpm} WPM\`)`
                  : ``) +
                (stats.last > 0
                  ? `\nLast game: \`${stats.last}s\` (\`${lastWpm} WPM\`)`
                  : ``)
              : `\nNo games yet!`)
        );

      await message.channel.send(embed);
    }
  },
  info,
  help: {
    usage: "typeraceinfo [@user] [shoob/easy/medium/hard]",
    examples: ["tri", "tri @JeDaYoshi", "trs @wong i"],
    description: "See Type race stats!",
  },
};

const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");
const { createPagedResults } = require("../../utils/PagedResults");
const {
  diffs,
  difficulty,
  getCpm,
  getTopPlayers,
  getTopPlayersByDiff,
} = require("../../utils/typeRaceUtils");

const info = {
  name: "trleaderboard",
  aliases: ["trlb"],
  matchCase: false,
  category: "UwU",
};

module.exports = {
  execute: async (instance, message, args) => {
    const di = args.length >= 1 && args.shift()[0].toLowerCase();
    if (args.length >= 1 && !Object.keys(diffs).includes(di)) return false;

    message.channel.startTyping();
    message.channel.stopTyping();

    if (!di) {
      // single page, leaderboard for all difficulties.
      const stats = await getTopPlayers(instance, 3);

      const embed = new MessageEmbed()
        .setAuthor(`Typerace Leaderboard`, message.guild.iconURL())
        .setColor(stats.length > 0 ? Color.default : Color.red)
        .setImage(Constants.footer);

      await Object.values(diffs).forEach(async (diff) => {
        const ds = stats.find((d) => d.difficulty === diff);
        if (!ds) return;

        const top = await ds.users.map(async (u, i) => {
          const user = await instance.client.users.fetch(u.discord_id);
          const name = user ? `\`${user.tag}\`` : `<@!${u.discord_id}>`;
          const cpm = getCpm(diff, u.top);
          return (
            `> ` +
            (i === 0 ? "<a:Sirona_star:748985391360507924>" : `**${i + 1}.**`) +
            ` ${name} - \`${u.top}s\` (\`${cpm} CPM\`)`
          );
        });

        embed.addField(diff.charAt(0).toUpperCase() + diff.slice(1), top);
      });

      await message.channel.send(embed);
      return true;
    } else {
      // multiple pages for per-difficulty typerace lb
      const diff = diffs[di];
      const dName = diff.charAt(0).toUpperCase() + diff.slice(1);
      let last = -1;

      return await createPagedResults(message, Infinity, async (page) => {
        const offset = (page > last && last !== -1 ? last : page) * 8;
        const stats = await getTopPlayersByDiff(instance, diff, 8, offset);
        if (stats.length === 0 && page === 0) {
          const embed = new MessageEmbed()
            .setDescription(
              `<:Sirona_NoCross:762606114444935168> No players have played this difficulty!`
            )
            .setColor(Color.red);
          await message.channel.send(embed);
          return false;
        }
        if (stats.length < 8 && last === -1) {
          last = page;
        }
        if (last !== -1 && page > last) return null;
        const singlePage = last === page && page === 0;

        const users = [];
        const cpm = [];
        const time = [];

        for (const entry of stats) {
          const user = await instance.client.users.fetch(entry.discord_id);
          const name = user ? `\`${user.tag}\`` : `<@!${entry.discord_id}>`;
          users.push(`> ${name}`);
          cpm.push(`> \`${getCpm(diff, entry.top)}\``);
          time.push(`> \`${entry.top}s\``);
        }

        const embed = new MessageEmbed()
          .setAuthor(`${dName} Typerace Leaderboard`, message.guild.iconURL())
          .setColor(stats.length > 0 ? Color.default : Color.red)
          .setImage(Constants.footer)
          .setFooter(
            (!singlePage
              ? `Page: ${last !== -1 && page >= last ? "Last" : page + 1}`
              : "") +
              (last === -1 || page < last ? " | React ▶️ for next page" : "") +
              (page !== 0 ? " | React ◀️ to go back" : "")
          )
          .addField(`•   __User__`, users, true)
          .addField(`•   __CPM__`, cpm, true)
          .addField(`•   __Time__`, time, true);

        if (last === 0) {
          await message.channel.send(embed);
          return false;
        }
        return embed;
      });
    }
  },
  info,
  help: {
    usage: "trlb [shoob/easy/medium/hard]",
    examples: ["trlb", "trlb i"],
    description:
      "Top players of the Type Race, with the fastest known by Kirara!",
  },
};

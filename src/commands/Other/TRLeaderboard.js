const { MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");
const Constants = require("../../utils/Constants.json");
const { createPagedResults } = require("../../utils/PagedResults");
const {
  diffs,
  getCpm,
  getTopPlayers,
  getTopPlayersByDiff,
} = require("../../utils/typeRaceUtils");

const info = {
  name: "trleaderboard",
  aliases: ["trlb"],
  matchCase: false,
  category: "UwU",
  cooldown: 10,
};

module.exports = {
  execute: async (instance, message, args) => {
    const di = args.length >= 1 ? args.shift()[0].toLowerCase() : false;
    if (di !== false && !Object.keys(diffs).includes(di)) return false;

    message.channel.startTyping();
    message.channel.stopTyping();

    if (!di) {
      // leaderboard for all difficulties.
      const stats = await getTopPlayers(instance, 3);
      const diffR = Object.values(diffs).reverse();
      const tops = {};

      for (const diff of diffR) {
        const ds = stats.find(d => d.difficulty === diff);
        if (!ds) continue;

        const top = [];
        for (const [i, u] of ds.users.entries()) {
          const user = await instance.client.users.fetch(u.discord_id);
          const name = user ? `\`${user.tag}\`` : `<@!${u.discord_id}>`;
          const cpm = getCpm(diff, u.top);
          top.push(
            `> ` +
              (i === 0
                ? "<a:Sirona_star:748985391360507924>"
                : `**${i + 1}.**`) +
              ` ${name} - \`${u.top}s\` (\`${cpm} CPM\`)`
          );
        }

        if (top.length > 0)
          tops[diff.charAt(0).toUpperCase() + diff.slice(1)] = top;
      }

      const pages = Math.ceil(Object.keys(tops).length / 3);
      return await createPagedResults(message, pages, async page => {
        const offset = (page > pages - 1 ? pages - 1 : page) * 3;

        const embed = new MessageEmbed()
          .setAuthor(
            `Typerace Leaderboard`,
            message.guild.iconURL({ dynamic: true })
          )
          .setColor(stats.length > 0 ? Color.default : Color.red)
          .setDescription(
            "⚠️ **NOTE: LEADERBOARD WILL BE RESET EACH SEASON!**\nIf you don't want your stats included use the `trlb-optout command`"
          )
          .setImage(Constants.footer)
          .setFooter(
            pages > 1
              ? (page !== pages - 1 ? "React ▶️ for next page | " : "") +
                  "React ◀️ to go back"
              : ""
          );

        Object.keys(tops)
          .slice(offset, offset + 3)
          .forEach(t =>
            embed.addField(
              t + (t === "shoob" ? ` <:SShoob:783636544720207903>` : ""),
              tops[t]
            )
          );

        return embed;
      });
    } else {
      // multiple pages for per-difficulty typerace lb
      const diff = diffs[di];
      const dName = diff.charAt(0).toUpperCase() + diff.slice(1);
      let last = -1;

      return await createPagedResults(message, Infinity, async page => {
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
        if (stats.length === 0 && last === -1) {
          last = page - 1;
          if (last === -1) last = 0;
        } else if (stats.length < 8 && last === -1) {
          last = page;
        }
        if (last !== -1 && page > last) return null;
        const singlePage = last === page && page === 0;

        const users = [];
        const cpm = [];
        const time = [];

        for (const [i, entry] of stats.entries()) {
          const user = await instance.client.users.fetch(entry.discord_id);
          const name = user ? `\`${user.tag}\`` : `<@!${entry.discord_id}>`;
          users.push(`> \`${i + 1 + page * 8}.\` ${name}`);
          cpm.push(`> \`${getCpm(diff, entry.top)}\``);
          time.push(`> \`${entry.top}s\``);
        }

        const embed = new MessageEmbed()
          .setAuthor(
            `${dName} Typerace Leaderboard`,
            message.guild.iconURL({ dynamic: true })
          )
          .setColor(stats.length > 0 ? Color.default : Color.red)
          .setDescription(
            "⚠️ **NOTE: LEADERBOARD WILL BE RESET EACH SEASON!**\nIf you don't want your stats included use the `trlb-optout command`"
          )
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
    usage: "trlb [shoob/collect/easy/medium/hard/impossible]",
    examples: ["trlb", "trlb i"],
    description:
      "Top players of the Type Race, with the fastest known by Kirara!",
  },
};

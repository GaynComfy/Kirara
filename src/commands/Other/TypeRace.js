const { EmbedBuilder } = require("discord.js");
const Color = require("../../utils/Colors.json");
const cd = new Map();
const {
  diffs,
  difficulty,
  getCpm,
  userPlay,
  genCaptcha,
} = require("../../utils/typeRaceUtils");
const { tierInfo } = require("../../utils/cardUtils");

const tiers = Object.keys(tierInfo).map(t => t.toLowerCase());
const diffKeys = Object.keys(diffs);

const end = (startTime, endTime) => {
  let timeDiff = endTime - startTime; // in ms
  // strip the ms
  timeDiff /= 1000;

  return timeDiff;
};
const channelMap = [];

const info = {
  name: "typerace",
  aliases: ["tr"],
  matchCase: false,
  category: "UwU",
  perms: ["ATTACH_FILES"],
  needsQueue: true,
};
module.exports = {
  execute: async (instance, message, args, queue) => {
    if (
      cd.has(message.channel.id) &&
      Date.now() - cd.get(message.channel.id) < 8000
    ) {
      return queue.addItem(() => message.react("🕘").catch(() => null));
    }
    if (channelMap[message.channel.id])
      return queue.addItem(() => message.react("🕘").catch(() => null));

    let di = args.length > 0 ? args.shift().toLowerCase() : false;
    const tier =
      typeof di === "string" &&
      di[0] === "t" &&
      !isNaN(di[1]) &&
      tiers.indexOf(di) !== -1 &&
      di !== "ts"
        ? parseInt(di[1])
        : false;
    if (tier !== false) di = "collect";
    if (di !== false && !diffKeys.includes(di[0])) return false;

    const s = Symbol();
    channelMap[message.channel.id] = s;

    const diff = diffs[di[0] || "m"];
    const plays = [];
    const results = [];
    const resultsw = [];
    const timer = [];

    const { buffer, txt } = await genCaptcha(diff, tier);

    const embed = new EmbedBuilder()
      .setColor(Color.default)
      .setImage("attachment://captcha.png");
    if (diff === "shoob" || diff === "spawn")
      embed.setDescription("To claim, use: `claim [captcha code]`");
    else if (diff === "collect")
      embed.setDescription("To claim, use: `collect [captcha code]`");

    let m;
    try {
      m = await message.channel.send({
        embeds: [embed],
        files: [
          {
            attachment: buffer,
            name: "captcha.png",
          },
        ],
      });
    } catch (err) {
      delete channelMap[message.channel.id];
      throw err;
    }
    const startTime = m.createdTimestamp;

    const filter = msg =>
      channelMap[message.channel.id] === s &&
      msg.content.toLowerCase() ===
        (diff === "shoob" || diff === "spawn"
          ? `claim ${txt}`
          : diff === "collect"
          ? `collect ${txt}`
          : txt) &&
      plays.indexOf(msg.author.id) === -1;
    const collector = message.channel.createMessageCollector({
      filter,
      time: difficulty[diff] >= 12 ? 15000 : 10000,
    });

    collector.on("collect", msg => {
      const took = end(startTime, msg.createdTimestamp);
      const cpm = getCpm(diff, took);
      const first = plays.length === 0;
      plays.push(msg.author.id);
      results.push(`> \`${msg.author.tag}\``);
      resultsw.push(`> \`${cpm}\``);
      timer.push(`> \`${took}s\``);

      userPlay(
        instance,
        msg.author.id,
        diff,
        first,
        took,
        `${msg.guild.id}:${msg.channel.id}:${msg.id}`
      )
        .then(async lastTop => {
          // do not react if we can't
          if (
            !message.guild.members.cache
              .get(instance.client.user.id)
              .permissions.has(["ADD_REACTIONS", "READ_MESSAGE_HISTORY"])
          )
            return;

          const toReact = first ? "🏅" : "✅";
          await queue.addItem(() => msg.react(toReact));
          if (lastTop !== null && took < lastTop) {
            // new record!
            await new Promise(resolve => setTimeout(resolve, 1000));
            await queue.addItem(() =>
              msg.react("<a:Sirona_star:748985391360507924>")
            );
          }
        })
        .catch(err => {
          // no need to complain for Discord errors
          if (err.httpStatus > 401) return;

          console.error(err);
          // error saving score?
          queue.addItem(() => msg.react("❌").catch(() => null));
        });
    });

    collector.on("end", () => {
      delete channelMap[message.channel.id];

      const result = new EmbedBuilder()
        .setTitle(
          `Type race results: ${
            diff.charAt(0).toUpperCase() + diff.substring(1)
          }` +
            (["shoob", "collect"].includes(diff)
              ? ` <:SShoob:783636544720207903>`
              : "")
        )
        .setColor(Color.white);

      if (plays.length === 0) {
        result.setDescription(
          "> <:Sirona_NoCross:762606114444935168> No participants!"
        );
      } else {
        result.addFields([
          { name: `•   __User__`, value: results.join("\n"), inline: true },
          { name: `•   __CPM__`, value: resultsw.join("\n"), inline: true },
          { name: `•   __Time__`, value: timer.join("\n"), inline: true },
        ]);
      }
      message.channel.send({ embeds: [result] });
      cd.set(message.channel.id, Date.now());
    });
    return collector;
  },
  info,
  help: {
    usage: "typerace [shoob/collect/easy/medium/hard/impossible]",
    examples: ["typerace", "tr s"],
    description: "See who's the fastest resolving the captcha!",
  },
};

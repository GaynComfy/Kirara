const { MessageAttachment, MessageEmbed } = require("discord.js");
const Color = require("../../utils/Colors.json");
const {
  colors,
  diffs,
  difficulty,
  getCpm,
  userPlay,
  genCaptcha,
} = require("../../utils/typeRaceUtils");
const tiers = Object.keys(colors);

const info = {
  name: "typerace",
  aliases: ["tr"],
  matchCase: false,
  category: "UwU",
  perms: ["ATTACH_FILES"],
  needsQueue: true,
};

const end = (startTime, endTime) => {
  let timeDiff = endTime - startTime; // in ms
  // strip the ms
  timeDiff /= 1000;

  return timeDiff;
};
const channelMap = [];

module.exports = {
  execute: async (instance, message, args, queue) => {
    if (channelMap[message.channel.id])
      return queue.addItem(() => message.react("🕘").catch(() => {}));

    let di = args.length > 0 ? args.shift().toLowerCase() : false;
    const tier =
      typeof di === "string" &&
      di[0] === "t" &&
      !isNaN(di[1]) &&
      tiers.indexOf(di[1]) !== -1
        ? parseInt(di[1])
        : false;
    if (tier !== false) di = "collect";
    if (di !== false && !Object.keys(diffs).includes(di[0])) return false;

    const s = Symbol();
    channelMap[message.channel.id] = s;

    const diff = diffs[di[0] || "m"];
    const plays = [];
    const results = [];
    const resultsw = [];
    const timer = [];

    const { buffer, txt } = await genCaptcha(diff, tier);

    const attachment = new MessageAttachment(buffer, "captcha.png");
    const embed = new MessageEmbed()
      .attachFiles([attachment])
      .setColor(Color.default)
      .setImage("attachment://captcha.png");
    if (diff === "shoob")
      embed.setDescription("To claim, use: `claim [captcha code]`");
    else if (diff === "collect")
      embed.setDescription("To claim, use: `collect [captcha code]`");

    let m;
    try {
      m = await message.channel.send(embed);
    } catch (err) {
      delete channelMap[message.channel.id];
      throw err;
    }
    const startTime = m.createdTimestamp;

    const collector = message.channel.createMessageCollector(
      msg =>
        channelMap[message.channel.id] === s &&
        msg.content.toLowerCase() ===
          (diff === "shoob"
            ? `claim ${txt}`
            : diff === "collect"
            ? `collect ${txt}`
            : txt) &&
        plays.indexOf(msg.author.id) === -1,
      { time: difficulty[diff] >= 12 ? 15000 : 10000 }
    );

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
            !message.guild
              .member(instance.client.user)
              .hasPermission(["ADD_REACTIONS", "READ_MESSAGE_HISTORY"])
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
          if (err.httpStatus === 403) return;

          console.error(err);
          // error saving score?
          queue.addItem(() => msg.react("❌").catch(() => {}));
        });
    });

    collector.on("end", () => {
      delete channelMap[message.channel.id];

      const result = new MessageEmbed()
        .setTitle(
          `Type race results: ${diff.charAt(0).toUpperCase() + diff.slice(1)}` +
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
        result
          .addField("•   __User__", results, true)
          .addField("•   __CPM__", resultsw, true)
          .addField("•   __Time__", timer, true);
      }
      message.channel.send(result);
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

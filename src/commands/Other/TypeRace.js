const { MessageAttachment, MessageEmbed } = require("discord.js");
const { CaptchaGenerator } = require("captcha-canvas");
const tcaptcha = require("trek-captcha");
const Color = require("../../utils/Colors.json");
const {
  diffs,
  difficulty,
  getCpm,
  userPlay,
} = require("../../utils/typeRaceUtils");

const info = {
  name: "typerace",
  aliases: ["tr"],
  matchCase: false,
  category: "UwU",
};

const end = (startTime) => {
  const endTime = new Date();
  let timeDiff = endTime - startTime; // in ms
  // strip the ms
  timeDiff /= 1000;

  return timeDiff;
};
const channelMap = [];

module.exports = {
  execute: async (instance, message, args) => {
    if (channelMap[message.channel.id]) return;
    const di = args.length > 0 ? args.shift()[0].toLowerCase() : false;
    if (di !== false && !Object.keys(diffs).includes(di)) return false;

    const s = Symbol();
    channelMap[message.channel.id] = s;

    const diff = diffs[di];
    const results = [];
    const resultsw = [];
    const timer = [];

    let startTime = new Date();

    let buffer, txt;
    if (diff === "shoob") {
      const captcha = await tcaptcha({ style: 0 });

      buffer = captcha.buffer;
      txt = captcha.token;
    } else {
      const captcha = new CaptchaGenerator({ width: 600, height: 200 })
        .setCaptcha({ characters: difficulty[diff], color: "#8cbaff" })
        .setDecoy({ opacity: difficulty[diff] >= 8 ? 0.8 : 0 })
        .setTrace({ color: "#8cbaff", opacity: difficulty[diff] < 14 ? 1 : 0 });

      buffer = await captcha.generateSync();
      txt = captcha.text.toLowerCase();
    }

    const attachment = new MessageAttachment(buffer, "captcha.png");
    const embed = new MessageEmbed()
      .attachFiles([attachment])
      .setColor(Color.default)
      .setImage("attachment://captcha.png");
    if (diff === "shoob")
      embed.setDescription("To claim, use: `claim [captcha code]`");

    await message.channel.send(embed);
    startTime = new Date();

    const collector = message.channel.createMessageCollector(
      (msg) =>
        channelMap[message.channel.id] === s &&
        msg.content.toLowerCase() ===
          (diff === "shoob" ? `claim ${txt}` : txt) &&
        results.indexOf(`\`${msg.author.tag}\``) === -1,
      { time: difficulty[diff] >= 12 ? 15000 : 10000 }
    );

    collector.on("collect", async (msg) => {
      const took = end(startTime);
      const cpm = getCpm(diff, took);
      results.push(`> \`${msg.author.tag}\``);
      resultsw.push(`> \`${cpm}\``);
      timer.push(`> \`${took}s\``);

      const first = results.length === 1;
      msg.react(first ? "🏅" : "✅");
      const lastTop = await userPlay(
        instance,
        msg.author.id,
        diff,
        first,
        took
      );
      if (took < lastTop) {
        // new record!
        msg.react("<a:Sirona_star:748985391360507924>");
      }
    });

    collector.on("end", (collected) => {
      if (channelMap[message.channel.id] !== s) return;

      const result = new MessageEmbed()
        .setTitle(
          `Type race results: ${diff.charAt(0).toUpperCase() + diff.slice(1)}` +
            (diff === "shoob" ? ` <:SShoob:783636544720207903>` : "")
        )
        .setColor(Color.white);

      if (results.length === 0) {
        result.setDescription("No participants!");
      } else {
        result
          .addField("__User__", results, true)
          .addField("__CPM__", resultsw, true)
          .addField("__Time__", timer, true);
      }
      message.channel.send(result);

      delete channelMap[message.channel.id];
    });
  },
  info,
  help: {
    usage: "typerace [shoob/easy/medium/hard/great/impossible]",
    examples: ["typerace", "tr s"],
    description: "See who's the fastest resolving the captcha!",
  },
};

const { MessageAttachment, MessageEmbed } = require("discord.js");
const { CaptchaGenerator } = require("captcha-canvas");
const { createCanvas } = require("canvas");
const Color = require("../../utils/Colors.json");

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

const diffs = {
  s: "shoob",
  e: "easy",
  m: "medium",
  h: "hard",
  i: "impossible",
};
const difficulty = {
  shoob: 5,
  easy: 6,
  medium: 8,
  hard: 10,
  impossible: 14,
};
const channelMap = [];

const whiteBg = (() => {
  const c = createCanvas(260, 70);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  return c.toBuffer();
})();

module.exports = {
  execute: async (instance, message, args) => {
    if (channelMap[message.channel.id]) return;
    const s = Symbol();
    channelMap[message.channel.id] = s;

    const diff = diffs[args.length > 0 && args.shift()[0]] || "medium";
    const results = [];
    const resultsw = [];
    const timer = [];

    let startTime = new Date();

    const captcha = new CaptchaGenerator(
      diff === "shoob"
        ? { height: 70, width: 260 }
        : { height: 200, width: 600 }
    )
      .setCaptcha({
        characters: difficulty[diff],
        color: diff === "shoob" ? "#111111" : "#8cbaff",
      })
      .setDecoy({ opacity: difficulty[diff] >= 8 ? 0.8 : 0 })
      .setTrace({
        color: diff === "shoob" ? "#111111" : "#8cbaff",
        opacity: difficulty[diff] === 6 ? 0 : 1,
      }); // CANVAS
    if (diff === "shoob") captcha.setBackground(whiteBg);

    const buffer = await captcha.generateSync(); // IMG TO ATTACH
    const txt = captcha.text.toLowerCase(); // TEXT FOR VAR

    const attachment = new MessageAttachment(buffer, "captcha.png");
    const embed = new MessageEmbed()
      .attachFiles([attachment])
      .setColor(Color.default)
      .setImage("attachment://captcha.png");

    await message.channel.send(embed);
    startTime = new Date();

    const collector = message.channel.createMessageCollector(
      (msg) =>
        channelMap[message.channel.id] === s &&
        msg.content.toLowerCase() ===
          (diff === "shoob" ? `claim ${txt}` : txt) &&
        results.indexOf(`\`${msg.author.tag}\``) === -1,
      { time: diff === "impossible" ? 15000 : 10000 }
    );

    collector.on("collect", async (msg) => {
      const took = end(startTime);
      const wpm = Math.round((txt.length / 5 / took) * 60);
      results.push(`\`${msg.author.tag}\``);
      resultsw.push(`\`${wpm}\``);
      timer.push(`\`${took}s\``);
      msg.react(results.length === 1 ? "🏅" : "✅");
    });

    collector.on("end", (collected) => {
      if (channelMap[message.channel.id] !== s) return;

      const result = new MessageEmbed()
        .setTitle(
          `Type race results: ${diff.charAt(0).toUpperCase() + diff.slice(1)}`
        )
        .setColor(Color.white);

      if (results.length === 0) {
        result.setDescription("No participants!");
      } else {
        result
          .addField("__User__", results, true)
          .addField("__WPM__", resultsw, true)
          .addField("__Time__", timer, true);
      }
      message.channel.send(result);

      delete channelMap[message.channel.id];
    });
  },
  info,
  help: {
    usage: "typerace [easy/medium/hard]",
    examples: ["typerace", "tr m"],
    description: "See who's the fastest resolving the captcha!",
  },
};

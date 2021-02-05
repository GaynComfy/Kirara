const { MessageAttachment, MessageEmbed } = require("discord.js");
const { CaptchaGenerator } = require("captcha-canvas");
const { createCanvas } = require("canvas");
const tcaptcha = require("trek-captcha");
const Color = require("../../utils/Colors.json");
const {
  colors,
  diffs,
  difficulty,
  getCpm,
  getTopPlayersByDiff,
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
const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const charSetSpace = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ";
const randomStr = (len, cS = charSet) => {
  let rStr = "";
  for (let i = 0; i < len; i++) {
    let rPos = Math.floor(Math.random() * cS.length);
    rStr += cS.substring(rPos, rPos + 1);
  }
  return rStr;
};

module.exports = {
  execute: async (instance, message, args) => {
    if (channelMap[message.channel.id]) return;
    const di = args.length > 0 ? args.shift()[0].toLowerCase() : false;
    if (di !== false && !Object.keys(diffs).includes(di)) return false;

    const s = Symbol();
    channelMap[message.channel.id] = s;

    const diff = diffs[di || "m"];
    const plays = [];
    const results = [];
    const resultsw = [];
    const timer = [];

    let buffer, txt;
    if (diff === "shoob") {
      const captcha = await tcaptcha({ style: 0 });

      buffer = captcha.buffer;
      txt = captcha.token;
    } else if (diff === "collect") {
      const captcha = createCanvas(300, 33);
      const ctx = captcha.getContext("2d");
      let i = 0;
      txt = randomStr(10, charSetSpace);
      ctx.lineWidth = "1px";
      ctx.font = "16pt Porter";
      ctx.textAlign = "left";
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      while (i !== 11) {
        ctx.rect(0, i * 3, 300, 2);
        i++;
      }

      ctx.fill();
      ctx.fillText(txt, 4, 10);

      buffer = await captcha.toBuffer();
    } else {
      const captcha = new CaptchaGenerator({ width: 600, height: 200 })
        .setCaptcha({
          characters: difficulty[diff],
          color: "#8cbaff",
          text: randomStr(difficulty[diff]),
        })
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
    else if (diff === "collect")
      embed.setDescription("To claim, use: `collect [captcha code]`");

    await message.channel.send(embed);
    const startTime = new Date();

    const collector = message.channel.createMessageCollector(
      (msg) =>
        channelMap[message.channel.id] === s &&
        msg.content.toLowerCase() ===
          (diff === "shoob"
            ? `claim ${txt}`
            : diff === "collect"
            ? `collect ${txt.trim()}`
            : txt) &&
        plays.indexOf(msg.author.id) === -1,
      { time: difficulty[diff] >= 12 ? 15000 : 10000 }
    );

    collector.on("collect", (msg) => {
      const took = end(startTime);
      const cpm = getCpm(diff, took);
      const first = plays.length === 0;
      plays.push(msg.author.id);
      results.push(`> \`${msg.author.tag}\``);
      resultsw.push(`> \`${cpm}\``);
      timer.push(`> \`${took}s\``);

      msg.react(first ? "🏅" : "✅");
      userPlay(
        instance,
        msg.author.id,
        diff,
        first,
        took,
        `${msg.guild.id}:${msg.channel.id}:${msg.id}`
      ).then((lastTop) => {
        if (took < lastTop) {
          // new record!
          msg.react("<a:Sirona_star:748985391360507924>");
        }
      });
    });

    collector.on("end", (collected) => {
      if (channelMap[message.channel.id] !== s) return;

      const result = new MessageEmbed()
        .setTitle(
          `Type race results: ${diff.charAt(0).toUpperCase() + diff.slice(1)}` +
            (["shoob", "collect"].includes(diff)
              ? ` <:SShoob:783636544720207903>`
              : "")
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
    usage: "typerace [shoob/collect/easy/medium/hard/impossible]",
    examples: ["typerace", "tr s"],
    description: "See who's the fastest resolving the captcha!",
  },
};

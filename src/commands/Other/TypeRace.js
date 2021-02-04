const { MessageAttachment, MessageEmbed } = require("discord.js");
const { CaptchaGenerator } = require("captcha-canvas");

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

  // get seconds
  // const seconds = Math.round(timeDiff);
  return timeDiff;
};

const diffs = {
  e: "easy",
  m: "medium",
  h: "hard",
  i: "impossible",
};

module.exports = {
  execute: async (instance, message, args) => {
    const diff = diffs[args.length > 0 && args.slice()[0]] || "e";
    const results = [];
    const resultsw = [];
    const timer = [];

    let startTime = new Date();

    const difficulty = { easy: 6, medium: 8, hard: 10, impossible: 16 };
    const captcha = new CaptchaGenerator({ height: 200, width: 600 })
      .setCaptcha({ characters: difficulty[diff], color: "#8cbaff" })
      .setTrace({ color: "#8cbaff" }); // CANVAS
    const buffer = await captcha.generateSync(); // IMG TO ATTACH
    const txt = captcha.text.toLowerCase(); // TEXT FOR VAR

    const attachment = new MessageAttachment(buffer, "captcha.png");
    const embed = new MessageEmbed()
      .attachFiles([attachment])
      .setImage("attachment://captcha.png");

    await message.channel.send(embed);
    startTime = new Date();
    const collector = message.channel.createMessageCollector(
      (msg) => msg.content.toLowerCase() === txt,
      { time: 15000 }
    );

    collector.on("collect", async (msg) => {
      const took = end(startTime);
      const wpm = Math.round(txt.length / 5 / (took / 60));
      results.push(`${msg.author.tag}`);
      resultsw.push(`${wpm}`);
      timer.push(`${took}s`);
      msg.react(results.length === 1 ? "🥇" : "✅");
    });

    collector.on("end", (collected) => {
      const result = new MessageEmbed().setTitle(
        `Type race results: ${diff.charAt(0).toUpperCase() + diff.slice(1)}`
      );

      if (results.length === 0) {
        result.setDescription("No participants!");
      } else {
        result
          .addField("__User__", results, true)
          .addField("__WPM__", resultsw, true)
          .addField("__Time__", timer, true);
      }
      message.channel.send(result);
    });
  },
  info,
  help: {
    usage: "typerace [easy/medium/hard]",
    examples: ["typerace"],
    description: "See who's the fastest resolving the captcha!",
  },
};

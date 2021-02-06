// I am an arsehole for making this -JeDaYoshi
const { MessageAttachment, MessageEmbed } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const tcaptcha = require("trek-captcha");
const Color = require("../../utils/Colors.json");
const Fetcher = require("../../utils/CardFetcher");
const { difficulty, getCpm, userPlay } = require("../../utils/typeRaceUtils");
const { withOwner } = require("../../utils/hooks");

const info = {
  name: "spawn",
  aliases: [],
  matchCase: false,
  category: "Owner",
};

const tiers = {
  1: "#cccccc",
  2: "#7aff8d",
  3: "#58a0e3",
  4: "#ad58e3",
  5: "#f8f105",
  6: "#ea2222",
  S: "#000001",
};
const channelMap = [];
const end = (startTime, time) => {
  const endTime = time;
  let timeDiff = endTime - startTime; // in ms
  // strip the ms
  timeDiff /= 1000;

  return timeDiff;
};

module.exports = {
  execute: async (instance, message, args) => {
    if (channelMap[message.channel.id]) return;
    return withOwner(
      message.author.id,
      async () => {
        message.delete();
        if (args.length === 0) return false;
        const isEvent =
          args[0].toLowerCase() === "event" || args[0].toLowerCase() === "e";
        const isGlobal =
          args[0].toLowerCase() === "servers" ||
          args[0].toLowerCase() === "bot" ||
          args[0].toLowerCase() === "s";
        const isOldGlobal =
          args[0].toLowerCase() === "global" || args[0].toLowerCase() === "g";
        if (isEvent || isGlobal || isOldGlobal) args.shift();
        if (args.length === 0) return false;
        const hasTier = allowed.includes(args[0].toLowerCase());
        const hasCardId = cardId.test(args[0]);
        if (hasTier && args.length === 1) return false;
        message.channel.startTyping();
        const tier = hasTier ? args.shift()[1].toUpperCase() : "all";
        const card_id = hasCardId ? cardId.exec(args.shift())[2] : null;
        let card = null;
        if (card_id) {
          card =
            (await Fetcher.fetchById(instance, card_id, isEvent)) ||
            (!isEvent
              ? await Fetcher.fetchById(instance, card_id, !isEvent)
              : null);
        } else {
          const name = args.join(" ");
          card =
            (await Fetcher.fetchByName(instance, name, tier, isEvent)) ||
            (space.test(name)
              ? await Fetcher.fetchByName(
                  instance,
                  [...args.slice(-1), ...args.slice(0, -1)].join(" "),
                  tier,
                  isEvent
                )
              : null);
        }
        if (card === null) {
          message.channel.stopTyping();
          const embed = new MessageEmbed()
            .setDescription(
              `<:Sirona_NoCross:762606114444935168> No card found for that criteria.`
            )
            .setColor(Color.red);
          message.channel.send(embed);
          return null;
        }

        const s = Symbol();
        channelMap[message.channel.id] = s;
        const plays = [];
        const results = [];
        const resultsw = [];
        const timer = [];

        // image canvas
        const canvas = createCanvas(300, 430);
        const ctx = captcha.getContext("2d");
        const cardImg = await loadImage(encodeURI(card.image_url));
        ctx.drawImage(cardImg, 0, 0, 300, 360);

        // Shoob captcha
        const captcha = await tcaptcha({ style: 0 });
        const buffer = captcha.buffer;
        const txt = captcha.token;
        ctx.drawImage(buffer, 0, 360, 300, 70);

        // the fake spawn
        const attachment = new MessageAttachment(canvas.toBuffer(), "name.png");
        const embed = new MessageEmbed()
          .setColor(tiers[card.tier.toUpperCase()] || "#aaaaaa")
          .setTitle(`${card.name} Tier: ${card.tier.toUpperCase()}`)
          .setDescription(
            `To claim, use: \`claim [captcha code]\`\n` +
              `[See your card inventory on our site.](https://animesoul.com/inventory)` +
              `[Support us and get global rewards!](https://animesoul.com/premium)`
          )
          .attachFiles([attachment])
          .setImage("attachment://name.png");

        const m = await message.channel.send(embed);
        const startTime = m.createdTimestamp;

        // the typerace
        const collector = message.channel.createMessageCollector(
          (msg) =>
            channelMap[message.channel.id] === s &&
            msg.content.toLowerCase() === `claim ${txt}` &&
            plays.indexOf(msg.author.id) === -1,
          { time: 20000 }
        );

        collector.on("collect", (msg) => {
          const took = end(startTime, msg.createdTimestamp);
          const cpm = getCpm("shoob", took);
          const first = plays.length === 0;
          plays.push(msg.author.id);
          results.push(`> \`${msg.author.tag}\``);
          resultsw.push(`> \`${cpm}\``);
          timer.push(`> \`${took}s\``);

          if (first) {
            const embed = new MessageEmbed()
              .setColor("#80ca57")
              .setDescription(
                `<:green:807545430815801364> <@!${msg.author.id}> got the card! ` +
                  `Sadly not a real claim. Sent from Kirara!`
              );

            msg.channel.send(embed);
          }

          msg.react(first ? "🏅" : "✅");
          userPlay(
            instance,
            msg.author.id,
            "shoob",
            first,
            took,
            `${msg.guild.id}:${msg.channel.id}:${msg.id}`
          )
            .then((lastTop) => {
              if (took < lastTop) {
                // new record!
                msg.react("<a:Sirona_star:748985391360507924>");
              }
            })
            .catch((err) => {
              console.error(err);
              // error saving score?
              msg.react("❌");
            });
        });

        collector.on("end", (collected) => {
          if (channelMap[message.channel.id] !== s) return;

          if (plays.length === 0) {
            m.delete();
            message.channel
              .send(
                `Looks like no one got the card ${card.name} ` +
                  `T${card.tier.toUpperCase()} at this time..`
              )
              .then((msg) => setTimeout(() => msg.delete(), 5000));
          } else {
            const result = new MessageEmbed()
              .setTitle("Type race results: Shoob <:SShoob:783636544720207903>")
              .setColor(Color.white)
              .addField("•   __User__", results, true)
              .addField("•   __CPM__", resultsw, true)
              .addField("•   __Time__", timer, true);
            message.channel.send(result);
          }

          delete channelMap[message.channel.id];
        });
      },
      instance.config.owner
    );
  },
  info,
  help: {
    usage: "spawn [[tier] [card name]/[card ID]]",
    examples: ["spawn"],
    description:
      "If you see this, it means a Kirara developer is being an arsehole",
  },
};

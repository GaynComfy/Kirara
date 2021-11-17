// I am an arsehole for making this -JeDaYoshi
const { MessageAttachment, MessageEmbed } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const Color = require("../../utils/Colors.json");
const Fetcher = require("../../utils/CardFetcher");
const {
  getCpm,
  userPlay,
  genSpawnCaptcha,
} = require("../../utils/typeRaceUtils");
const { withOwner } = require("../../utils/hooks");
const { cardId } = require("../../utils/regexUtils");
const { tierInfo } = require("../../utils/cardUtils");

const tiers = Object.keys(tierInfo).map(t => t.toLowerCase());

const info = {
  name: "spawn",
  aliases: [],
  matchCase: false,
  category: "Owner",
  ownerOnly: true,
  perms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
  disabled: process.env.NODE_ENV !== "development",
  usage: "spawn <<event> [tier] <card name>/<card ID>>",
  examples: ["spawn"],
  description: '"debugging"',
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
        await message.delete();
        if (args.length === 0) return false;
        const isEvent =
          args[0].toLowerCase() === "event" || args[0].toLowerCase() === "e";
        if (isEvent) args.shift();
        if (args.length === 0) return false;
        const hasTier = tiers.includes(args[0].toLowerCase());
        const hasCardId = cardId.test(args[0]);
        if (hasTier && args.length === 1) return false;
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
            (name.indexOf(" ") !== -1
              ? await Fetcher.fetchByName(
                  instance,
                  [...args.slice(-1), ...args.slice(0, -1)].join(" "),
                  tier,
                  isEvent
                )
              : null);
        }
        if (card === null) {
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
        const ctx = canvas.getContext("2d");
        const cardImg = await loadImage(
          encodeURI(card.image_url).replace(".webp", ".gif")
        );
        ctx.drawImage(cardImg, 0, 0, 300, 380);

        const color =
          (tierInfo[`T${card.tier.toUpperCase()}`] || {}).color || "#aaaaaa";

        // Shoob captcha
        const { buffer, txt } = await genSpawnCaptcha(color);
        const captchaImg = await loadImage(buffer);
        ctx.drawImage(captchaImg, 21, 359, 259, 67);

        // the fake spawn
        const filename = `Anime_Soul-${message.guild.id}-${message.channel.id}-claim-drop.png`;
        const attachment = new MessageAttachment(canvas.toBuffer(), filename);
        const embed = new MessageEmbed()
          .setColor(color)
          .setTitle(card.name)
          .setURL(`https://animesoul.com/cards/info/${card.id}`)
          .setDescription(
            `To claim, use \`claim [captcha code]\`\n` +
              `[See your card inventory on our site.](https://animesoul.com/inventory)\n` +
              `[Support us and get global rewards!](https://animesoul.com/premium)`
          )
          .attachFiles([attachment])
          .setImage(`attachment://${filename}`)
          .setFooter(
            "Powered by AS Devs",
            "https://repo.mplauncher.pl/fun/wla/AS.webp"
          );

        const m = await message.channel.send(embed);
        const startTime = m.createdTimestamp;

        // the typerace
        const collector = message.channel.createMessageCollector(
          msg =>
            channelMap[message.channel.id] === s &&
            msg.content.toLowerCase() === `claim ${txt}` &&
            plays.indexOf(msg.author.id) === -1,
          { time: 15000 }
        );

        collector.on("collect", msg => {
          const took = end(startTime, msg.createdTimestamp);
          const cpm = getCpm("shoob", took);
          const first = plays.length === 0;
          plays.push(msg.author.id);
          results.push(`> \`${msg.author.tag}\``);
          resultsw.push(`> \`${cpm}\``);
          timer.push(`> \`${took}s\``);

          if (first) {
            const embed = new MessageEmbed()
              .setColor("#466fe9")
              .setDescription(
                `<@!${msg.author.id}> got the \`${card.name}\` Issue #: \`0\`. See Who Sent The Message.`
              )
              .setFooter(
                "Powered by AS Devs",
                "https://repo.mplauncher.pl/fun/wla/AS.webp"
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
            .then(lastTop => {
              if (took < lastTop) {
                // new record!
                msg.react("<a:Sirona_star:748985391360507924>");
              }
            })
            .catch(err => {
              console.error(err);
              // error saving score?
              msg.react("❌");
            });
        });

        collector.on("end", () => {
          delete channelMap[message.channel.id];

          if (plays.length === 0) {
            embed
              .setDescription(
                "Looks like nobody got the dropped\ncard this time."
              )
              .setColor("#FF0000");

            m.edit(embed)
              .then(() =>
                setTimeout(() => {
                  m.delete().catch(() => {});
                }, 15000)
              )
              .catch(console.error);
          } else {
            const result = new MessageEmbed()
              .setTitle("Type race results: Shoob <:SShoob:783636544720207903>")
              .setColor(Color.white)
              .addField("•   __User__", results, true)
              .addField("•   __CPM__", resultsw, true)
              .addField("•   __Time__", timer, true);
            message.channel.send(result);
          }
        });
      },
      instance.config.owner
    );
  },
  info,
};
